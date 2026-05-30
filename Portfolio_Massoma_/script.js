const container = document.getElementById("network3d");

if (container) {

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1424);

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / 550,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, 550);
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  function createDevice(w, h, d, x, y, z, name, info) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
    );
    mesh.position.set(x, y, z);
    mesh.userData = { name, info };
    scene.add(mesh);
    return mesh;
  }

  const router = createDevice(2, 0.5, 1, 0, 2, 0,
    "Routeur",
    "IP: 192.168.1.1\nFonction: NAT / Firewall / DHCP"
  );

  const sw = createDevice(3, 0.5, 1, 0, 0, 0,
    "Switch L2",
    "VLAN 10 / 20 / 30 configurés"
  );

  const server = createDevice(1, 2, 1, -4, -2, 0,
    "Serveur",
    "IP: 192.168.1.10\nRôle: Fichiers / Backup"
  );

  const pc = createDevice(1, 1, 1, 4, -2, 0,
    "PC Client",
    "IP via DHCP\nAccès LAN"
  );

  function connect(a, b) {
    const points = [a.position, b.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x00eaff })
    );
    scene.add(line);
  }

  connect(router, sw);
  connect(sw, server);
  connect(sw, pc);

  camera.position.set(0, 5, 10);

  // 🎯 TRAFIC RÉSEAU

  function createPacket(start, end) {

    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0x00eaff,
        emissive: 0x0088aa
      })
    );

    scene.add(packet);

    let progress = 0;

    return {
      update() {
        progress += 0.01;
        if (progress > 1) progress = 0;

        packet.position.lerpVectors(start.position, end.position, progress);
      }
    };
  }

  const packets = [
    createPacket(router, sw),
    createPacket(sw, server),
    createPacket(sw, pc)
  ];

  // 🎯 INTERACTION CLIC

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener("click", (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
      const obj = intersects[0].object;
      if (obj.userData.name) {
        document.getElementById("infoPanel").innerText =
          obj.userData.name + "\n\n" + obj.userData.info;
      }
    }
  });

  // 🎬 ANIMATION LOOP

  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    packets.forEach(packet => packet.update());

    renderer.render(scene, camera);
  }

  animate();
}
