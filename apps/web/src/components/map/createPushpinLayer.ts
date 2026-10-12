import {
  MercatorCoordinate,
  type CustomLayerInterface,
  type Map as MapLibreMap,
} from "maplibre-gl";

import * as THREE from "three";

import type { MapDestination } from "../../types/destination";

export type PinLocation = MapDestination;

export type InteractivePushpinLayer = CustomLayerInterface & {
  pick: (point: { x: number; y: number }) => PinLocation | null;
};

const EARTH_RADIUS = 6_371_008.8;

// Intentionally exaggerated to remain visible from space
const PIN_HEIGHT = 180_000;
const HEAD_RADIUS = 45_000;
const SHAFT_RADIUS = 7_000;

const CLOSEUP_PIN_BOOST = 2;

// Globe positioning
const getGlobeMatrix = ({ latitude, longitude }: PinLocation) => {
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

// Mercator positioning
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

export const createPushpinLayer = (
  pins: PinLocation[],
): InteractivePushpinLayer => {
  const screenPositions: {
    index: number;
    x: number;
    y: number;
  }[] = [];

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  let map: MapLibreMap;
  let renderer: THREE.WebGLRenderer | null = null;

  let previousScale = -1;
  let previousProjection: boolean | null = null;

  // Precalculate Mercator positions
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

  let mercatorOrigin: MercatorCoordinate | null = null;
  let originUnitsPerMeter = 1;

  // Pin geometry
  const shaftGeometry = new THREE.CylinderGeometry(
    SHAFT_RADIUS,
    SHAFT_RADIUS * 0.45,
    PIN_HEIGHT,
    8,
  );

  shaftGeometry.translate(0, PIN_HEIGHT / 2, 0);

  const shaftMaterial = new THREE.MeshPhongMaterial({
    color: 0xaeb4bd,
    specular: 0xffffff,
    shininess: 110,
  });

  const headGeometry = new THREE.SphereGeometry(HEAD_RADIUS, 20, 12);

  headGeometry.translate(0, PIN_HEIGHT + HEAD_RADIUS * 0.65, 0);

  const headMaterial = new THREE.MeshPhongMaterial({
    color: 0xc91e28,
    specular: 0xffaaaa,
    shininess: 110,
  });

  // Instanced meshes
  const shafts = new THREE.InstancedMesh(
    shaftGeometry,
    shaftMaterial,
    pins.length,
  );

  const heads = new THREE.InstancedMesh(
    headGeometry,
    headMaterial,
    pins.length,
  );

  shafts.frustumCulled = false;
  heads.frustumCulled = false;

  scene.add(shafts, heads);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(-1, 3, 2);
  scene.add(light);

  // Update instance transformations
  const updateInstances = (isGlobe: boolean, scale: number) => {
    const size = new THREE.Vector3(scale, scale, scale);

    pins.forEach((pin, index) => {
      const matrix = isGlobe
        ? getGlobeMatrix(pin)
        : getLocalMercatorMatrix(
            mercatorPins[index],
            mercatorOrigin!,
            originUnitsPerMeter,
          );

      matrix.scale(size);

      shafts.setMatrixAt(index, matrix);
      heads.setMatrixAt(index, matrix);
    });

    shafts.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
  };

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

      renderer.autoClear = false;

      map.triggerRepaint();
    },

    render: (_gl, args) => {
      if (!renderer) return;

      const isGlobe = args.defaultProjectionData.projectionTransition > 0;

      // Update the floating origin when necessary
      let originChanged = false;

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

          originChanged = true;
        }
      }

      // Calculate zoom-based pin scaling
      const zoom = map.getZoom();

      const baseScale = Math.min(1, 2 ** (2.5 - zoom));

      const closeupBoost = THREE.MathUtils.lerp(
        1,
        CLOSEUP_PIN_BOOST,
        THREE.MathUtils.smootherstep(zoom, 2.5, 7),
      );

      const scale = baseScale * closeupBoost;

      if (
        isGlobe !== previousProjection ||
        scale !== previousScale ||
        originChanged
      ) {
        updateInstances(isGlobe, scale);

        previousProjection = isGlobe;
        previousScale = scale;
      }

      // IMPORTANT:
      // Start with MapLibre's projection matrix EVERY frame.
      // Never reuse the previous frame's camera matrix.
      const projection = new THREE.Matrix4().fromArray(
        args.defaultProjectionData.mainMatrix,
      );

      // Convert local meter coordinates into Mercator space.
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

      // Render the pins
      renderer.resetState();
      renderer.render(scene, camera);

      // Recalculate screen-space positions for hover/click
      // IMPORTANT: Do not accumulate positions between frames.
      screenPositions.length = 0;

      const clippingPlane = args.defaultProjectionData.clippingPlane;

      const width = map.getCanvas().clientWidth;
      const height = map.getCanvas().clientHeight;

      const instanceMatrix = new THREE.Matrix4();
      const projected = new THREE.Vector4();
      const base = new THREE.Vector3();

      for (let index = 0; index < pins.length; index++) {
        heads.getMatrixAt(index, instanceMatrix);

        // Exclude pins behind the globe
        if (isGlobe) {
          base.setFromMatrixPosition(instanceMatrix);

          const visibility =
            base.x * clippingPlane[0] +
            base.y * clippingPlane[1] +
            base.z * clippingPlane[2] +
            clippingPlane[3];

          if (visibility < 0) continue;
        }

        projected
          .set(0, PIN_HEIGHT + HEAD_RADIUS * 0.65, 0, 1)
          .applyMatrix4(instanceMatrix)
          .applyMatrix4(projection);

        if (projected.w <= 0) continue;

        const x = projected.x / projected.w;
        const y = projected.y / projected.w;

        if (Math.abs(x) > 1 || Math.abs(y) > 1) {
          continue;
        }

        screenPositions.push({
          index,
          x: ((x + 1) / 2) * width,
          y: ((1 - y) / 2) * height,
        });
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

    pick: ({ x, y }) => {
      let closestIndex = -1;
      let closestDistance = 14 * 14;

      for (const position of screenPositions) {
        const dx = position.x - x;
        const dy = position.y - y;

        const distance = dx * dx + dy * dy;

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = position.index;
        }
      }

      return closestIndex === -1 ? null : pins[closestIndex];
    },
  };
};
