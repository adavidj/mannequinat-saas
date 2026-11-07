'use client';

import { useEffect, useRef } from 'react';

/**
 * Sculpture 3D : anneau d'or et gemme émeraude, rendus WebGL (three.js).
 * Chargement différé, aucun rendu côté serveur, pause automatique si
 * l'utilisateur préfère réduire les animations.
 */
export function HeroCanvas({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // La sculpture est masquée sous 1024px : inutile d'initialiser un contexte WebGL.
    if (!window.matchMedia('(min-width: 1024px)').matches) {
      return;
    }

    // Mode captures (`?capture=1`) : on rend quelques images puis on arrête la
    // boucle. Le moteur de capture obtient une image nette, sculpture comprise,
    // au lieu d'attendre indéfiniment une frame stable d'un rendu continu.
    const captureMode = new URLSearchParams(window.location.search).has('capture');

    let disposed = false;
    let frame = 0;
    let teardown = () => {};

    // Laisse le premier rendu et l'hydratation s'installer avant le travail
    // WebGL : le contenu de la page reste interactif immédiatement.
    const startTimer = window.setTimeout(() => {
      void (async () => {
        const THREE = await import('three');
        if (disposed || !hostRef.current) return;

        const hostEl = hostRef.current;
        let renderer: import('three').WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
            // Permet de vérifier le rendu réel (lecture de pixels) sans altérer l'affichage.
            preserveDrawingBuffer: true,
          });
        } catch {
          return;
        }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        hostEl.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 8.2);

        // Environnement équirectangulaire dégradé : reflets or / émeraude.
        const width = 128;
        const height = 64;
        const data = new Uint8Array(width * height * 4);
        const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t);
        const warm: [number, number, number] = [248, 226, 175];
        const mid: [number, number, number] = [126, 98, 60];
        const deep: [number, number, number] = [11, 38, 31];

        for (let y = 0; y < height; y += 1) {
          const v = y / height;
          const from = v < 0.5 ? warm : mid;
          const to = v < 0.5 ? mid : deep;
          const t = v < 0.5 ? v / 0.5 : (v - 0.5) / 0.5;
          for (let x = 0; x < width; x += 1) {
            const i = (y * width + x) * 4;
            const spot =
              Math.exp(-(((x / width - 0.28) * 5) ** 2) - ((v - 0.22) * 7) ** 2) * 170 +
              Math.exp(-(((x / width - 0.72) * 9) ** 2) - ((v - 0.42) * 10) ** 2) * 60;
            data[i] = Math.min(255, lerp(from[0], to[0], t) + spot);
            data[i + 1] = Math.min(255, lerp(from[1], to[1], t) + spot);
            data[i + 2] = Math.min(255, lerp(from[2], to[2], t) + spot * 0.8);
            data[i + 3] = 255;
          }
        }

        const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromEquirectangular(texture).texture;
        scene.environment = environment;
        texture.dispose();
        pmrem.dispose();

        const group = new THREE.Group();
        group.position.set(1.15, 0.1, 0);

        const gold = new THREE.MeshPhysicalMaterial({
          color: 0xd9b978,
          metalness: 1,
          roughness: 0.16,
          clearcoat: 1,
          clearcoatRoughness: 0.14,
          envMapIntensity: 1.5,
        });

        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.4, 32, 140), gold);
        ring.scale.set(1, 1, 0.68);
        ring.rotation.set(0.42, -0.35, 0.18);
        group.add(ring);

        const thin = new THREE.Mesh(
          new THREE.TorusGeometry(2.75, 0.022, 8, 180),
          new THREE.MeshPhysicalMaterial({
            color: 0xf1d9a4,
            metalness: 1,
            roughness: 0.25,
            envMapIntensity: 1.2,
          }),
        );
        thin.rotation.set(1.15, 0.2, -0.3);
        group.add(thin);

        const gem = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.34, 1),
          new THREE.MeshPhysicalMaterial({
            color: 0x1d6b52,
            metalness: 0.35,
            roughness: 0.08,
            clearcoat: 1,
            envMapIntensity: 1.6,
          }),
        );
        gem.position.set(1.85, -1.55, 0.35);
        group.add(gem);

        const key = new THREE.DirectionalLight(0xfff1d6, 2.4);
        key.position.set(4, 6, 5);
        scene.add(key);

        const rim = new THREE.DirectionalLight(0x3f9a78, 1.9);
        rim.position.set(-6, -2, -4);
        scene.add(rim);

        scene.add(group);

        let pointerX = 0;
        let pointerY = 0;
        let easedX = 0;
        let easedY = 0;

        function onPointerMove(event: PointerEvent) {
          const rect = hostEl.getBoundingClientRect();
          pointerX = (event.clientX - rect.left) / rect.width - 0.5;
          pointerY = (event.clientY - rect.top) / rect.height - 0.5;
        }

        function resize() {
          const rect = hostEl.getBoundingClientRect();
          const w = Math.max(1, rect.width);
          const h = Math.max(1, rect.height);
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        }

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(hostEl);
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        resize();

        let inView = true;
        let pageVisible = !document.hidden;
        let running = false;
        // En capture, on démarre sur une pose déjà travaillée et on s'arrête
        // après quelques images (la boucle infinie empêche la stabilisation).
        let elapsed = captureMode ? 1.8 : 0;
        let lastFrame = 0;
        let renderedFrames = 0;
        const frameBudget = captureMode ? 4 : Number.POSITIVE_INFINITY;

        function render(now = 0) {
          if (!running) return;
          if (lastFrame) elapsed += Math.min(0.05, (now - lastFrame) / 1000);
          lastFrame = now;

          const time = elapsed;
          easedX += (pointerX - easedX) * 0.045;
          easedY += (pointerY - easedY) * 0.045;

          group.rotation.y = time * 0.14 + easedX * 0.55;
          group.rotation.x = Math.sin(time * 0.19) * 0.1 + easedY * 0.32;
          group.position.y = 0.1 + Math.sin(time * 0.45) * 0.12;
          gem.rotation.x = time * 0.35;
          gem.rotation.y = time * 0.5;

          renderer.render(scene, camera);
          renderedFrames += 1;
          if (renderedFrames >= frameBudget) {
            running = false;
            return;
          }
          frame = requestAnimationFrame(render);
        }

        function setRunning(next: boolean) {
          if (next === running) return;
          running = next;
          if (running) {
            lastFrame = 0;
            frame = requestAnimationFrame(render);
          } else {
            cancelAnimationFrame(frame);
          }
        }

        // La boucle s'arrête dès que la sculpture quitte l'écran ou que l'onglet est
        // masqué : le thread principal reste libre pour le scroll et les révélations.
        const viewObserver = new IntersectionObserver(
          ([entry]) => {
            inView = Boolean(entry?.isIntersecting);
            setRunning(inView && pageVisible);
          },
          { threshold: 0.01 },
        );
        viewObserver.observe(hostEl);

        function onVisibilityChange() {
          pageVisible = !document.hidden;
          setRunning(inView && pageVisible);
        }
        document.addEventListener('visibilitychange', onVisibilityChange);

        setRunning(true);

        teardown = () => {
          running = false;
          cancelAnimationFrame(frame);
          viewObserver.disconnect();
          document.removeEventListener('visibilitychange', onVisibilityChange);
          resizeObserver.disconnect();
          window.removeEventListener('pointermove', onPointerMove);
          scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              const material = object.material;
              if (Array.isArray(material)) material.forEach((item) => item.dispose());
              else material.dispose();
            }
          });
          environment.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      })();
    }, 350);

    return () => {
      disposed = true;
      window.clearTimeout(startTimer);
      teardown();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
