import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type Map as MapLibreMap,
} from "maplibre-gl";

import * as THREE from "three";

import {
  SCORE_TIERS,
  SCORE_TIER_ORDER,
  getScoreTier,
  type ScoreTier,
} from "../../config/scoreTiers";

import type { MapDestination } from "../../types/destination";

export type PinLocation = MapDestination;

export type PinSelection = PinLocation & {
  activeScore: number | null;
  scoreCategory: string;
};

export type InteractivePushpinLayer = CustomLayerInterface & {
  pick: (point: { x: number; y: number }) => PinSelection | null;

  setScoreCategory: (
    category: string,
    scores: ReadonlyMap<number, number | null>,
  ) => void;
  setMatchingDestinationIds: (ids: ReadonlySet<number> | null) => void;
};

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const EARTH_RADIUS = 6_371_008.8;

const PIN_HEIGHT = 100_000;
const HEAD_RADIUS = 34_000;
const SHAFT_RADIUS = 5_000;

const BASE_HEAD_CENTER_Y = PIN_HEIGHT + HEAD_RADIUS * 0.35;

const CLOSEUP_PIN_BOOST = 3.2;

const HEAD_GROWTH_START = 3;
const HEAD_GROWTH_END = 10;

const BASE_FAR_SCALE = 0.46;
const BASE_NEAR_SCALE = 0.56;

// -----------------------------------------------------------------------------
// Neighborhood Configuration
// -----------------------------------------------------------------------------

const NEIGHBORHOOD_MIN_ZOOM = 11;

const NEIGHBORHOOD_ANIMATION_DURATION = 300;
const NEIGHBORHOOD_STAGGER_INTERVAL = 20;
const NEIGHBORHOOD_STAGGER_STEPS = 7;

const NEIGHBORHOOD_TOTAL_DURATION =
  NEIGHBORHOOD_ANIMATION_DURATION +
  (NEIGHBORHOOD_STAGGER_STEPS - 1) * NEIGHBORHOOD_STAGGER_INTERVAL;

const easeOutBack = (t: number): number => {
  const c = 1.70158;
  const x = t - 1;

  return 1 + (c + 1) * x ** 3 + c * x ** 2;
};

// -----------------------------------------------------------------------------
// Score filtering animation
// -----------------------------------------------------------------------------

const FILTER_ANIMATION_DURATION = 220;

// -----------------------------------------------------------------------------
// Score tiers
// -----------------------------------------------------------------------------
type PinAppearance = {
  tier: ScoreTier;
  color: THREE.Color;
  farScale: number;
  nearScale: number;
};

const getPinAppearance = (score: number | null): PinAppearance => {
  const tier = getScoreTier(score);
  const style = SCORE_TIERS[tier];

  return {
    tier,
    color: new THREE.Color(style.color),
    farScale: BASE_FAR_SCALE * style.sizeMultiplier,
    nearScale: BASE_NEAR_SCALE * style.sizeMultiplier,
  };
};

const getHeadScale = (appearance: PinAppearance, zoom: number): number => {
  const progress = THREE.MathUtils.smootherstep(
    zoom,
    HEAD_GROWTH_START,
    HEAD_GROWTH_END,
  );

  return THREE.MathUtils.lerp(
    appearance.farScale,
    appearance.nearScale,
    progress,
  );
};

// -----------------------------------------------------------------------------
// Geographic transformations
// -----------------------------------------------------------------------------

const getGlobeMatrix = ({
  latitude,
  longitude,
}: PinLocation): THREE.Matrix4 => {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lng = THREE.MathUtils.degToRad(longitude);

  return new THREE.Matrix4()
    .makeRotationY(lng)
    .multiply(new THREE.Matrix4().makeRotationX(-lat))
    .multiply(new THREE.Matrix4().makeTranslation(0, 0, 1))
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
    .multiply(
      new THREE.Matrix4().makeScale(
        1 / EARTH_RADIUS,
        1 / EARTH_RADIUS,
        1 / EARTH_RADIUS,
      ),
    );
};

type MercatorPin = {
  x: number;
  y: number;
  z: number;
  unitsPerMeter: number;
};

const getLocalMercatorMatrix = (
  coordinate: MercatorPin,
  origin: MercatorCoordinate,
  originUnitsPerMeter: number,
): THREE.Matrix4 => {
  const deltaX = coordinate.x - origin.x;
  const wrappedX = deltaX - Math.round(deltaX);

  const x = wrappedX / originUnitsPerMeter;
  const y = -(coordinate.y - origin.y) / originUnitsPerMeter;
  const z = (coordinate.z - origin.z) / originUnitsPerMeter;

  const scale = coordinate.unitsPerMeter / originUnitsPerMeter;

  return new THREE.Matrix4()
    .makeTranslation(x, y, z)
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
    .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
};

// -----------------------------------------------------------------------------
// 3D pushpin layer
// -----------------------------------------------------------------------------

export const createPushpinLayer = (
  pins: PinLocation[],
): InteractivePushpinLayer => {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  let map: MapLibreMap;
  let renderer: THREE.WebGLRenderer | null = null;

  let neighborhoodAnimationTime = 0;
  let lastAnimationFrameTime: number | null = null;

  const revealScaleVector = new THREE.Vector3();

  // Positions of visible heads, used for hover and click.
  const screenPositions: Array<{
    index: number;
    x: number;
    y: number;
    radius: number;
  }> = [];

  let activeCategory = "overall";

  const activeScores = pins.map((pin) => pin.overallScore);
  const appearances = activeScores.map((score) => getPinAppearance(score));
  const renderIndices = pins.map((_, index) => index);

  let matchingDestinationIds: ReadonlySet<number> | null = null;

  // One animation progress value per destination.
  // 1 = fully visible, 0 = completely hidden.
  const filterProgress = new Float32Array(pins.length);

  filterProgress.fill(1);

  const sortRenderIndices = () => {
    renderIndices.sort((a, b) => {
      const scoreA = activeScores[a] ?? -1;
      const scoreB = activeScores[b] ?? -1;

      return scoreA - scoreB || pins[a].id - pins[b].id;
    });
  };

  sortRenderIndices();

  // Cache globe transformations.
  const globeMatrices = pins.map(getGlobeMatrix);

  // Cache Mercator coordinates.
  const mercatorPins: MercatorPin[] = pins.map((pin) => {
    const coordinate = MercatorCoordinate.fromLngLat([
      pin.longitude,
      pin.latitude,
    ]);

    return {
      x: coordinate.x,
      y: coordinate.y,
      z: coordinate.z,
      unitsPerMeter: coordinate.meterInMercatorCoordinateUnits(),
    };
  });

  // Floating-origin state.
  let mercatorOrigin: MercatorCoordinate | null = null;
  let originUnitsPerMeter = 1;
  let mercatorMatrices: THREE.Matrix4[] = [];

  // ---------------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------------

  const shaftGeometry = new THREE.CylinderGeometry(
    SHAFT_RADIUS,
    SHAFT_RADIUS * 0.45,
    PIN_HEIGHT,
    8,
  );
  shaftGeometry.translate(0, PIN_HEIGHT / 2, 0);

  const headGeometry = new THREE.SphereGeometry(HEAD_RADIUS, 28, 18);
  headGeometry.translate(0, BASE_HEAD_CENTER_Y, 0);

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------

  const shaftMaterial = new THREE.MeshPhongMaterial({
    color: 0xaeb4bd,
    specular: 0xb8c0c8,
    shininess: 70,
  });

  // All seven tiers share exactly the same material.
  // Per-instance colors determine their appearance.
  //
  // We deliberately avoid premium outlines, metallic
  // shells and glow geometry.
  //
  // Transparent rendering with opacity 1 allows us
  // to control visual priority between tier meshes.

  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0x555555,
    shininess: 45,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
  });

  // ---------------------------------------------------------------------------
  // Instanced meshes
  // ---------------------------------------------------------------------------

  const shafts = new THREE.InstancedMesh(
    shaftGeometry,
    shaftMaterial,
    pins.length,
  );

  shafts.frustumCulled = false;
  shafts.count = 0;
  scene.add(shafts);

  const headMeshes = {} as Record<ScoreTier, THREE.InstancedMesh>;

  for (const tier of SCORE_TIER_ORDER) {
    const mesh = new THREE.InstancedMesh(
      headGeometry,
      headMaterial,
      pins.length,
    );

    mesh.frustumCulled = false;
    mesh.count = 0;

    // Higher scores draw later, covering lower scores
    // wherever their projected heads overlap.
    mesh.renderOrder = SCORE_TIER_ORDER.indexOf(tier) + 10;

    headMeshes[tier] = mesh;
    scene.add(mesh);
  }

  const allMeshes = [
    shafts,
    ...SCORE_TIER_ORDER.map((tier) => headMeshes[tier]),
  ];

  // ---------------------------------------------------------------------------
  // Lighting
  // ---------------------------------------------------------------------------

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(-1, 3, 2);
  scene.add(light);

  // ---------------------------------------------------------------------------
  // Reusable temporary objects
  // ---------------------------------------------------------------------------

  const instanceMatrix = new THREE.Matrix4();
  const headMatrix = new THREE.Matrix4();

  const headTranslationMatrix = new THREE.Matrix4();
  const headScaleMatrix = new THREE.Matrix4();

  const scaleVector = new THREE.Vector3();

  const base3D = new THREE.Vector3();

  const projected = new THREE.Vector4();
  const projectedRadiusX = new THREE.Vector4();
  const projectedRadiusZ = new THREE.Vector4();

  const headCounts = {} as Record<ScoreTier, number>;

  // ---------------------------------------------------------------------------
  // MapLibre custom layer
  // ---------------------------------------------------------------------------

  return {
    id: "destination-3d-pins",
    type: "custom",
    renderingMode: "3d",

    onAdd: (mapInstance, gl) => {
      map = mapInstance;

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
      });

      // Preserve the satellite imagery.
      renderer.autoClear = false;

      map.triggerRepaint();
    },

    render: (_gl, args) => {
      if (!renderer) return;

      const isGlobe = args.defaultProjectionData.projectionTransition > 0;

      // -----------------------------------------------------------------------
      // Floating origin
      // -----------------------------------------------------------------------

      if (!isGlobe) {
        const center = map.getCenter();

        const nextOrigin = MercatorCoordinate.fromLngLat([
          center.lng,
          center.lat,
        ]);

        const dx = nextOrigin.x - (mercatorOrigin?.x ?? nextOrigin.x);

        const wrappedDx = dx - Math.round(dx);

        const distance = mercatorOrigin
          ? Math.hypot(
              wrappedDx / originUnitsPerMeter,
              (nextOrigin.y - mercatorOrigin.y) / originUnitsPerMeter,
            )
          : Infinity;

        if (distance > 10_000) {
          mercatorOrigin = nextOrigin;

          originUnitsPerMeter = nextOrigin.meterInMercatorCoordinateUnits();

          mercatorMatrices = mercatorPins.map((pin) =>
            getLocalMercatorMatrix(pin, mercatorOrigin!, originUnitsPerMeter),
          );
        }
      }

      // -----------------------------------------------------------------------
      // Zoom-based scaling
      // -----------------------------------------------------------------------

      const zoom = map.getZoom();
      const now = performance.now();
      const shouldShowNeighborhoods = zoom >= NEIGHBORHOOD_MIN_ZOOM;

      const deltaTime =
        lastAnimationFrameTime === null
          ? 0
          : Math.min(now - lastAnimationFrameTime, 50);

      lastAnimationFrameTime = now;

      // Move the animation forward when zooming in,
      // and backward when zooming out.
      neighborhoodAnimationTime = THREE.MathUtils.clamp(
        neighborhoodAnimationTime +
          (shouldShowNeighborhoods ? deltaTime : -deltaTime),
        0,
        NEIGHBORHOOD_TOTAL_DURATION,
      );

      const baseScale = Math.min(1, 2 ** (2.5 - zoom));

      const closeupBoost = THREE.MathUtils.lerp(
        1,
        CLOSEUP_PIN_BOOST,
        THREE.MathUtils.smootherstep(zoom, 2.5, 9.5),
      );

      const scale = baseScale * closeupBoost;

      scaleVector.set(scale, scale, scale);

      // -----------------------------------------------------------------------
      // Projection matrix
      // -----------------------------------------------------------------------

      // Always use the current MapLibre matrix.
      const projection = new THREE.Matrix4().fromArray(
        args.defaultProjectionData.mainMatrix,
      );

      if (!isGlobe && mercatorOrigin) {
        const worldFromLocal = new THREE.Matrix4()
          .makeTranslation(mercatorOrigin.x, mercatorOrigin.y, mercatorOrigin.z)
          .multiply(
            new THREE.Matrix4().makeScale(
              originUnitsPerMeter,
              -originUnitsPerMeter,
              originUnitsPerMeter,
            ),
          );

        projection.multiply(worldFromLocal);
      }

      camera.projectionMatrix.copy(projection);

      const clippingPlane = args.defaultProjectionData.clippingPlane;

      const width = map.getCanvas().clientWidth;
      const height = map.getCanvas().clientHeight;

      // -----------------------------------------------------------------------
      // Reset instance counts
      // -----------------------------------------------------------------------

      screenPositions.length = 0;

      let shaftCount = 0;

      for (const tier of SCORE_TIER_ORDER) {
        headCounts[tier] = 0;
      }

      // -----------------------------------------------------------------------
      // Render destinations with score filtering
      // -----------------------------------------------------------------------

      let filterAnimating = false;

      for (const index of renderIndices) {
        const passesFilter =
          matchingDestinationIds === null ||
          matchingDestinationIds.has(pins[index].id);

        const targetProgress = passesFilter ? 1 : 0;
        const previousProgress = filterProgress[index];
        const nextProgress = THREE.MathUtils.clamp(
          previousProgress +
            (passesFilter ? 1 : -1) * (deltaTime / FILTER_ANIMATION_DURATION),
          0,
          1,
        );

        filterProgress[index] = nextProgress;

        if (nextProgress !== targetProgress) {
          filterAnimating = true;
        }

        // Completely hidden pins require no further processing.
        if (nextProgress <= 0) {
          continue;
        }

        const filterScale = THREE.MathUtils.smoothstep(nextProgress, 0, 1);

        const sourceMatrix = isGlobe
          ? globeMatrices[index]
          : mercatorMatrices[index];

        if (!sourceMatrix) continue;

        const appearance = appearances[index];

        // Geographic position and global zoom scaling.
        instanceMatrix.copy(sourceMatrix).scale(scaleVector);

        // Smoothly shrink or grow pins based on the active filter.
        instanceMatrix.scale(revealScaleVector.setScalar(filterScale));

        const pin = pins[index];

        if (pin.parentDestinationId !== null) {
          const delay =
            (pin.id % NEIGHBORHOOD_STAGGER_STEPS) *
            NEIGHBORHOOD_STAGGER_INTERVAL;

          const progress = THREE.MathUtils.clamp(
            (neighborhoodAnimationTime - delay) /
              NEIGHBORHOOD_ANIMATION_DURATION,
            0,
            1,
          );

          if (progress <= 0) {
            continue;
          }

          const revealScale = easeOutBack(progress);

          instanceMatrix.scale(revealScaleVector.setScalar(revealScale));
        }

        // Exclude destinations on Earth's far side.
        if (isGlobe) {
          base3D.setFromMatrixPosition(instanceMatrix);

          const visibility =
            base3D.x * clippingPlane[0] +
            base3D.y * clippingPlane[1] +
            base3D.z * clippingPlane[2] +
            clippingPlane[3];

          if (visibility < 0) continue;
        }

        // ---------------------------------------------------------------------
        // Head sizing
        // ---------------------------------------------------------------------

        const headScale = getHeadScale(appearance, zoom);

        // The head sits on the fixed-length shaft.
        // Its center moves slightly with its size so
        // smaller spheres still connect to the shaft.
        const headCenterY = PIN_HEIGHT + HEAD_RADIUS * headScale * 0.35;

        headTranslationMatrix.makeTranslation(
          0,
          headCenterY - BASE_HEAD_CENTER_Y * headScale,
          0,
        );

        headScaleMatrix.makeScale(headScale, headScale, headScale);

        headMatrix
          .copy(instanceMatrix)
          .multiply(headTranslationMatrix)
          .multiply(headScaleMatrix);

        // ---------------------------------------------------------------------
        // Project the head into screen coordinates
        // ---------------------------------------------------------------------

        projected
          .set(0, BASE_HEAD_CENTER_Y, 0, 1)
          .applyMatrix4(headMatrix)
          .applyMatrix4(projection);

        if (projected.w <= 0 || !Number.isFinite(projected.w)) {
          continue;
        }

        const ndcX = projected.x / projected.w;
        const ndcY = projected.y / projected.w;

        if (
          !Number.isFinite(ndcX) ||
          !Number.isFinite(ndcY) ||
          Math.abs(ndcX) > 1 ||
          Math.abs(ndcY) > 1
        ) {
          continue;
        }

        const x = ((ndcX + 1) / 2) * width;
        const y = ((1 - ndcY) / 2) * height;

        // ---------------------------------------------------------------------
        // Calculate clickable head radius
        // ---------------------------------------------------------------------

        projectedRadiusX
          .set(HEAD_RADIUS, BASE_HEAD_CENTER_Y, 0, 1)
          .applyMatrix4(headMatrix)
          .applyMatrix4(projection);

        projectedRadiusZ
          .set(0, BASE_HEAD_CENTER_Y, HEAD_RADIUS, 1)
          .applyMatrix4(headMatrix)
          .applyMatrix4(projection);

        let hitRadius = 10;

        if (projectedRadiusX.w > 0 && projectedRadiusZ.w > 0) {
          const radiusX =
            ((projectedRadiusX.x / projectedRadiusX.w + 1) / 2) * width;

          const radiusY =
            ((1 - projectedRadiusX.y / projectedRadiusX.w) / 2) * height;

          const radiusZX =
            ((projectedRadiusZ.x / projectedRadiusZ.w + 1) / 2) * width;

          const radiusZY =
            ((1 - projectedRadiusZ.y / projectedRadiusZ.w) / 2) * height;

          const projectedHeadRadius = Math.max(
            Math.hypot(radiusX - x, radiusY - y),
            Math.hypot(radiusZX - x, radiusZY - y),
          );

          if (Number.isFinite(projectedHeadRadius)) {
            hitRadius = THREE.MathUtils.clamp(projectedHeadRadius + 4, 6, 32);
          }
        }

        // ---------------------------------------------------------------------
        // Assign instances
        // ---------------------------------------------------------------------

        // Shafts retain their original dimensions.
        shafts.setMatrixAt(shaftCount++, instanceMatrix);

        const headMesh = headMeshes[appearance.tier];
        const slot = headCounts[appearance.tier]++;

        headMesh.setMatrixAt(slot, headMatrix);
        headMesh.setColorAt(slot, appearance.color);

        screenPositions.push({
          index,
          x,
          y,
          radius: hitRadius,
        });
      }

      // -----------------------------------------------------------------------
      // Update GPU instance counts
      // -----------------------------------------------------------------------

      shafts.count = shaftCount;

      for (const tier of SCORE_TIER_ORDER) {
        headMeshes[tier].count = headCounts[tier];
      }

      for (const mesh of allMeshes) {
        mesh.instanceMatrix.needsUpdate = true;

        if (mesh.instanceColor) {
          mesh.instanceColor.needsUpdate = true;
        }
      }

      renderer.resetState();
      renderer.render(scene, camera);

      const isNeighborhoodAnimating = shouldShowNeighborhoods
        ? neighborhoodAnimationTime < NEIGHBORHOOD_TOTAL_DURATION
        : neighborhoodAnimationTime > 0;

      if (isNeighborhoodAnimating || filterAnimating) {
        map.triggerRepaint();
      }
    },

    onRemove: () => {
      screenPositions.length = 0;

      shaftGeometry.dispose();
      headGeometry.dispose();

      shaftMaterial.dispose();
      headMaterial.dispose();

      renderer?.dispose();
      renderer = null;
    },

    // -------------------------------------------------------------------------
    // Hover and click hit-testing
    // -------------------------------------------------------------------------

    pick: ({ x, y }) => {
      let bestIndex = -1;
      let bestScore = -Infinity;
      let bestDistance = Infinity;

      for (const position of screenPositions) {
        const score = activeScores[position.index];

        // Pins excluded by the active filter cannot be selected.
        if (
          matchingDestinationIds !== null &&
          !matchingDestinationIds.has(pins[position.index].id)
        ) {
          continue;
        }

        const dx = position.x - x;
        const dy = position.y - y;

        const distance = dx * dx + dy * dy;

        if (distance > position.radius ** 2) {
          continue;
        }

        const priority = score ?? -1;

        if (
          priority > bestScore ||
          (priority === bestScore && distance < bestDistance)
        ) {
          bestIndex = position.index;
          bestScore = priority;
          bestDistance = distance;
        }
      }

      if (bestIndex === -1) {
        return null;
      }

      return {
        ...pins[bestIndex],
        activeScore: activeScores[bestIndex],
        scoreCategory: activeCategory,
      };
    },
    setScoreCategory: (category, scores) => {
      activeCategory = category;

      for (let index = 0; index < pins.length; index++) {
        const pin = pins[index];

        const score = scores.has(pin.id)
          ? (scores.get(pin.id) ?? null)
          : category === "overall"
            ? pin.overallScore
            : null;

        activeScores[index] = score;
        appearances[index] = getPinAppearance(score);
      }

      // Update score-dependent instance ordering.
      sortRenderIndices();

      // Request a new frame without rebuilding the layer.
      map?.triggerRepaint();
    },
    setMatchingDestinationIds: (ids) => {
      matchingDestinationIds = ids;

      // Animate using the existing layer and instance meshes.
      map?.triggerRepaint();
    },
  };
};
