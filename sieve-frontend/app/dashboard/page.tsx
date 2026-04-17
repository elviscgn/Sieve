"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faUsers,
  faEye,
  faPlus,
  faDownload,
  faArrowUp,
  faArrowDown,
  faClock,
  faCheckCircle,
  faCalendar,
  faChevronRight,
  faChevronLeft,
  faChartBar,
  faStar,
  faSearch,
  faGlobe,
  faBars,
  faChevronDown,
  faCircle,
  faHashtag,
  faUser,
  faSignal,
  faCog,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faBell,
  faCalendarAlt,
  faClock as farClock,
  faCheckCircle as farCheckCircle,
  faStar as farStar,
} from "@fortawesome/free-regular-svg-icons";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import Chart from "chart.js/auto";
import { feature } from "topojson-client";

// Types
interface DashboardStats {
  activeJobs: number;
  totalCandidates: number;
  totalReviewed: number;
}

interface RecentSession {
  _id: string;
  jobTitle: string;
  candidatesScreened: number;
  avgScore: number;
  topCandidate: string;
  status: "completed" | "running";
  createdAt: string;
}

interface CandidateRow {
  id: string;
  name: string;
  role: string;
  level: string;
  aiScore: number;
  date: string;
  status: "Active" | "Pending" | "Rejected";
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState("Good morning");
  const [stats] = useState<DashboardStats>({
    activeJobs: 352,
    totalCandidates: 18780,
    totalReviewed: 18780,
  });

  const [recentSessions] = useState<RecentSession[]>([
    {
      _id: "1",
      jobTitle: "Senior Full Stack Engineer",
      candidatesScreened: 156,
      avgScore: 72,
      topCandidate: "Thabo Ndlovu",
      status: "completed",
      createdAt: "2026-04-15T10:30:00Z",
    },
    {
      _id: "2",
      jobTitle: "Product Designer",
      candidatesScreened: 89,
      avgScore: 68,
      topCandidate: "Lerato Khumalo",
      status: "running",
      createdAt: "2026-04-14T14:20:00Z",
    },
    {
      _id: "3",
      jobTitle: "Backend Engineer",
      candidatesScreened: 203,
      avgScore: 75,
      topCandidate: "Sipho Mahlangu",
      status: "completed",
      createdAt: "2026-04-12T09:15:00Z",
    },
  ]);

  const [candidates] = useState<CandidateRow[]>([
    {
      id: "CAND-101",
      name: "Thabo Ndlovu",
      role: "Frontend Lead",
      level: "Senior",
      aiScore: 92,
      date: "Mar 12",
      status: "Active",
    },
    {
      id: "CAND-102",
      name: "Lerato Khumalo",
      role: "Product Designer",
      level: "Mid",
      aiScore: 74,
      date: "Mar 14",
      status: "Pending",
    },
    {
      id: "CAND-103",
      name: "Sipho Mahlangu",
      role: "Backend Engineer",
      level: "Senior",
      aiScore: 88,
      date: "Mar 10",
      status: "Active",
    },
    {
      id: "CAND-104",
      name: "Naledi Molefe",
      role: "Data Analyst",
      level: "Junior",
      aiScore: 51,
      date: "Mar 16",
      status: "Rejected",
    },
    {
      id: "CAND-105",
      name: "Kagiso Modise",
      role: "DevOps",
      level: "Lead",
      aiScore: 95,
      date: "Mar 18",
      status: "Active",
    },
  ]);

  // View toggle state
  const [viewMode, setViewMode] = useState<"chart" | "globe">("globe");
  const [filterText, setFilterText] = useState("Monthly");
  const filterOptions = ["Weekly", "Monthly", "Yearly"];
  const [filterIndex, setFilterIndex] = useState(1);

  // Schedule tabs
  const [activeTab, setActiveTab] = useState<"today" | "tomorrow" | "week">(
    "today",
  );

  // Globe refs
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const threeRefs = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    labelRenderer?: CSS2DRenderer;
    controls?: OrbitControls;
    animationId?: number;
    countryMeshes?: THREE.Mesh[];
    tooltipElem?: HTMLDivElement;
  }>({});

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Date strip generation
  const dateStripDays = useCallback(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(
      today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1),
    );
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push({
        day: days[i],
        date: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
      });
    }
    return result;
  }, []);

  // Chart initialization
  useEffect(() => {
    if (
      viewMode === "chart" &&
      chartCanvasRef.current &&
      !chartInstanceRef.current
    ) {
      const ctx = chartCanvasRef.current.getContext("2d");
      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            datasets: [
              {
                label: "Remote",
                data: [22, 28, 35, 42, 48, 55, 60],
                backgroundColor: "#2563eb",
                borderRadius: {
                  topLeft: 0,
                  topRight: 0,
                  bottomLeft: 4,
                  bottomRight: 4,
                },
                stack: "stack1",
                barPercentage: 0.6,
                categoryPercentage: 0.65,
              },
              {
                label: "Hybrid",
                data: [30, 35, 40, 45, 50, 55, 62],
                backgroundColor: "#60a5fa",
                borderRadius: 0,
                stack: "stack1",
                barPercentage: 0.6,
                categoryPercentage: 0.65,
              },
              {
                label: "On-Site",
                data: [42, 38, 45, 52, 58, 65, 70],
                backgroundColor: "#bfdbfe",
                borderRadius: {
                  topLeft: 4,
                  topRight: 4,
                  bottomLeft: 0,
                  bottomRight: 0,
                },
                stack: "stack1",
                barPercentage: 0.6,
                categoryPercentage: 0.65,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                border: { display: false },
                ticks: { color: "#94a3b8", font: { size: 11 } },
              },
              y: {
                stacked: true,
                grid: { display: false },
                border: { display: false },
                ticks: { display: false },
              },
            },
          },
        });
      }
    }
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [viewMode]);

  // Globe initialization
  useEffect(() => {
    if (viewMode !== "globe" || !globeContainerRef.current) return;

    const container = globeContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Cleanup previous
    if (threeRefs.current.animationId)
      cancelAnimationFrame(threeRefs.current.animationId);
    if (threeRefs.current.controls) threeRefs.current.controls.dispose();
    while (container.firstChild) container.removeChild(container.firstChild);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0";
    labelRenderer.domElement.style.left = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    container.style.position = "relative";
    container.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Tooltip
    const tooltipElem = document.createElement("div");
    tooltipElem.className = "country-tooltip";
    tooltipElem.style.position = "absolute";
    tooltipElem.style.display = "none";
    tooltipElem.style.background = "#ffffff";
    tooltipElem.style.color = "#0f172a";
    tooltipElem.style.padding = "8px 14px";
    tooltipElem.style.borderRadius = "12px";
    tooltipElem.style.fontSize = "12px";
    tooltipElem.style.fontWeight = "600";
    tooltipElem.style.fontFamily = '"Work Sans", sans-serif';
    tooltipElem.style.border = "1.5px solid #e2e8f0";
    tooltipElem.style.boxShadow = "0 4px 16px rgba(15,30,80,0.12)";
    tooltipElem.style.pointerEvents = "none";
    tooltipElem.style.whiteSpace = "nowrap";
    tooltipElem.style.zIndex = "10000";
    document.body.appendChild(tooltipElem);

    // Countries data
    const countries = [
      { name: "South Africa", lat: -30.5595, lon: 22.9375, applicants: 1240 },
      { name: "Nigeria", lat: 9.082, lon: 8.6753, applicants: 980 },
      { name: "Kenya", lat: -1.2864, lon: 36.8172, applicants: 670 },
      { name: "Egypt", lat: 26.8206, lon: 30.8025, applicants: 520 },
      { name: "UK", lat: 55.3781, lon: -3.436, applicants: 2100 },
      { name: "USA", lat: 37.0902, lon: -95.7129, applicants: 3450 },
      { name: "India", lat: 20.5937, lon: 78.9629, applicants: 2890 },
      { name: "Germany", lat: 51.1657, lon: 10.4515, applicants: 1560 },
      { name: "Brazil", lat: -14.235, lon: -51.9253, applicants: 890 },
      { name: "Canada", lat: 56.1304, lon: -106.3468, applicants: 1750 },
    ];

    const latLonToPosition = (lat: number, lon: number, radius: number) => {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180;
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta),
      );
    };

    // Fetch world map and generate points
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json")
      .then((res) => res.json())
      .then((topoData) => {
        const landGeoJSON = feature(topoData, topoData.objects.land) as any;
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = "#ffffff";
        landGeoJSON.features.forEach((f: any) => {
          const geom = f.geometry;
          const drawPolygon = (coords: any) => {
            ctx.beginPath();
            coords[0].forEach((coord: number[], i: number) => {
              const lon = coord[0];
              const lat = coord[1];
              const x = ((lon + 180) / 360) * 1024;
              const y = ((90 - lat) / 180) * 512;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
          };
          if (geom.type === "Polygon") drawPolygon(geom.coordinates);
          else if (geom.type === "MultiPolygon")
            geom.coordinates.forEach(drawPolygon);
        });

        const imageData = ctx.getImageData(0, 0, 1024, 512);
        const data = imageData.data;
        const numPoints = 12000;
        const landPositions: number[] = [];
        const oceanPositions: number[] = [];
        const radius = 2.0;

        for (let i = 0; i < numPoints; i++) {
          const y = 1 - (i / (numPoints - 1)) * 2;
          const r = Math.sqrt(1 - y * y);
          const theta = i * Math.PI * (3 - Math.sqrt(5));
          const px = Math.cos(theta) * r;
          const pz = Math.sin(theta) * r;
          const py = y;
          const lat = (Math.asin(py) * 180) / Math.PI;
          const lon = (Math.atan2(px, pz) * 180) / Math.PI;
          const cx = Math.floor(((lon + 180) / 360) * 1023);
          const cy = Math.floor(((90 - lat) / 180) * 511);
          const pixelIndex = (cy * 1024 + cx) * 4;
          const isLand = data[pixelIndex] > 128;
          const pos = new THREE.Vector3(px * radius, py * radius, pz * radius);
          if (isLand) landPositions.push(pos.x, pos.y, pos.z);
          else oceanPositions.push(pos.x, pos.y, pos.z);
        }

        const landGeom = new THREE.BufferGeometry();
        landGeom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(landPositions, 3),
        );
        const landMat = new THREE.PointsMaterial({
          color: "#93c5fd",
          size: 0.1,
          sizeAttenuation: true,
          transparent: true,
        });
        const landPoints = new THREE.Points(landGeom, landMat);
        globeGroup.add(landPoints);

        const oceanGeom = new THREE.BufferGeometry();
        oceanGeom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(oceanPositions, 3),
        );
        const oceanMat = new THREE.PointsMaterial({
          color: "#1e40af",
          size: 0.03,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.35,
        });
        const oceanPoints = new THREE.Points(oceanGeom, oceanMat);
        globeGroup.add(oceanPoints);

        const glowGeom = new THREE.SphereGeometry(2.05, 48, 24);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          wireframe: true,
          transparent: true,
          opacity: 0.04,
        });
        const glowMesh = new THREE.Mesh(glowGeom, glowMat);
        globeGroup.add(glowMesh);

        // Markers
        const markerGroup = new THREE.Group();
        const countryMeshes: THREE.Mesh[] = [];
        countries.forEach((c) => {
          const pos = latLonToPosition(c.lat, c.lon, 2.08);
          const pinColor = 0x10b981;
          const pinGroup = new THREE.Group();
          const headGeo = new THREE.SphereGeometry(0.04, 12, 12);
          const headMat = new THREE.MeshStandardMaterial({
            color: pinColor,
            emissive: pinColor,
            emissiveIntensity: 0.4,
          });
          const head = new THREE.Mesh(headGeo, headMat);
          head.position.set(0, 0, 0);
          pinGroup.add(head);
          const stemGeo = new THREE.ConeGeometry(0.016, 0.07, 8);
          const stemMat = new THREE.MeshStandardMaterial({ color: pinColor });
          const stem = new THREE.Mesh(stemGeo, stemMat);
          stem.position.set(0, 0, -0.035);
          pinGroup.add(stem);
          pinGroup.position.copy(pos);
          pinGroup.lookAt(new THREE.Vector3(0, 0, 0));
          pinGroup.rotateX(Math.PI);
          markerGroup.add(pinGroup);
          head.userData = { country: c.name, applicants: c.applicants };
          countryMeshes.push(head);
        });
        globeGroup.add(markerGroup);
        threeRefs.current.countryMeshes = countryMeshes;

        // Connections
        const connections = [
          [0, 1],
          [0, 2],
          [0, 3],
          [1, 2],
          [1, 4],
          [2, 5],
          [3, 6],
          [4, 5],
          [5, 7],
          [6, 8],
          [7, 9],
          [8, 9],
          [0, 5],
          [2, 6],
        ];
        const linePoints: number[] = [];
        connections.forEach((pair) => {
          const p1 = latLonToPosition(
            countries[pair[0]].lat,
            countries[pair[0]].lon,
            2.06,
          );
          const p2 = latLonToPosition(
            countries[pair[1]].lat,
            countries[pair[1]].lon,
            2.06,
          );
          linePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        });
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(linePoints, 3),
        );
        const lines = new THREE.LineSegments(
          lineGeom,
          new THREE.LineBasicMaterial({
            color: "#60a5fa",
            transparent: true,
            opacity: 0.3,
          }),
        );
        globeGroup.add(lines);

        scene.add(new THREE.AmbientLight(0x404060));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        const backLight = new THREE.PointLight(0x4466aa, 0.6);
        backLight.position.set(-3, 1, -3);
        scene.add(backLight);
        const fillLight = new THREE.PointLight(0x88aaff, 0.4);
        fillLight.position.set(2, 3, -4);
        scene.add(fillLight);
      });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObj: THREE.Mesh | null = null;

    const animate = () => {
      threeRefs.current.animationId = requestAnimationFrame(animate);
      controls.update();
      if (threeRefs.current.countryMeshes) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(
          threeRefs.current.countryMeshes,
        );
        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          if (hoveredObj !== hit) {
            hoveredObj = hit;
            const data = hit.userData;
            tooltipElem.style.display = "block";
            tooltipElem.innerHTML = `${data.country} <small style="font-weight:400;color:#2563eb;margin-left:6px;">${data.applicants} applicants</small>`;
          }
          const vector = hit.position.clone().project(camera);
          const x = (vector.x * 0.5 + 0.5) * width;
          const y = (-vector.y * 0.5 + 0.5) * height;
          const rect = container.getBoundingClientRect();
          tooltipElem.style.left = rect.left + x + "px";
          tooltipElem.style.top = rect.top + y - 30 + "px";
        } else {
          if (hoveredObj) {
            tooltipElem.style.display = "none";
            hoveredObj = null;
          }
        }
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    container.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    threeRefs.current = {
      scene,
      camera,
      renderer,
      labelRenderer,
      controls,
      tooltipElem,
    };

    return () => {
      if (threeRefs.current.animationId)
        cancelAnimationFrame(threeRefs.current.animationId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      if (tooltipElem.parentNode) document.body.removeChild(tooltipElem);
    };
  }, [viewMode]);

  const handleFilterClick = () => {
    setFilterIndex((prev) => (prev + 1) % filterOptions.length);
    setFilterText(filterOptions[(filterIndex + 1) % filterOptions.length]);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <header className="h-[62px] bg-white flex items-center justify-between px-6 border-b border-[#e2e8f0] sticky top-0 z-10 shadow-sm -mx-6 -mt-6 mb-6">
        <div className="flex items-center gap-3">
          <button className="hidden max-[900px]:block text-xl text-[#0f172a] cursor-pointer">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center bg-[#f8fafc] rounded-full pl-4 pr-1 py-1 border border-[#e2e8f0] min-w-[280px] focus-within:border-[#3b82f6] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition-all">
            <FontAwesomeIcon
              icon={faSearch}
              className="text-[#94a3b8] text-[13px]"
            />
            <input
              placeholder="Search jobs, candidates..."
              className="border-0 bg-transparent py-1.5 px-2.5 text-[13px] w-full outline-none text-[#0f172a]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-4 font-semibold text-xs text-[#0f172a] flex items-center gap-1.5 cursor-pointer hover:border-primary hover:text-primary transition-all">
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
          <Link
            href="/sessions/new"
            className="bg-primary border-0 rounded-full py-2 px-[18px] font-bold text-xs text-white flex items-center gap-1.5 cursor-pointer shadow-[0_4px_14px_-4px_rgba(37,99,235,0.45)] hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} /> New Session
          </Link>
          <button className="p-1.5 px-2 rounded-xl text-[#475569] text-lg cursor-pointer border border-[#e2e8f0] hover:border-primary hover:text-primary transition-all">
            <FontAwesomeIcon icon={faBell} />
          </button>
          <div className="flex items-center gap-2 ml-0.5 py-1 pl-1.5 pr-3 rounded-full bg-white border border-[#e2e8f0] cursor-pointer hover:border-primary hover:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] transition-all">
            <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center border-2 border-primary-light overflow-hidden">
              <img
                src="https://avatars.githubusercontent.com/u/96030189?v=4"
                alt="Elvis Chege"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs">Elvis Chege</span>
              <span className="text-[10px] text-[#475569]">Recruiter</span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="text-[10px] text-[#94a3b8]"
            />
          </div>
        </div>
      </header>

      {/* Greeting */}
      <div className="text-[13px] text-[#475569] font-medium mb-1">
        {greeting}, Elvis 👋
      </div>
      <div className="mb-[18px]">
        <h2 className="font-bold text-[26px] text-[#0f172a]">Dashboard</h2>
        <p className="text-[#475569] text-[13px]">
          Overview of notes regarding HR management
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6 items-stretch max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-2">
          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white py-2 px-3 rounded-2xl shadow-sm border border-[#f1f5f9] hover:shadow-[0_12px_32px_-8px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 transition-all animate-fadeUp">
              <div className="w-10 h-10 bg-primary-pale rounded-xl flex items-center justify-center text-primary text-xl mb-3">
                <FontAwesomeIcon icon={faBriefcase} />
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a] leading-tight mb-1">
                {stats.activeJobs}
              </div>
              <div className="text-xs font-medium text-[#475569]">
                Total opened jobs
              </div>
              <span className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">
                <FontAwesomeIcon icon={faArrowUp} className="text-[9px]" /> 12%
                this month
              </span>
            </div>
            <div className="bg-white py-2 px-3 rounded-2xl shadow-sm border border-[#f1f5f9] hover:shadow-[0_12px_32px_-8px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 transition-all animate-fadeUp [animation-delay:50ms]">
              <div className="w-10 h-10 bg-primary-pale rounded-xl flex items-center justify-center text-primary text-xl mb-3">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a] leading-tight mb-1">
                {stats.totalCandidates.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-[#475569]">
                Total applicants
              </div>
              <span className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">
                <FontAwesomeIcon icon={faArrowUp} className="text-[9px]" /> 9.4%
                this month
              </span>
            </div>
            <div className="bg-white py-2 px-3 rounded-2xl shadow-sm border border-[#f1f5f9] hover:shadow-[0_12px_32px_-8px_rgba(37,99,235,0.18)] hover:-translate-y-0.5 transition-all animate-fadeUp [animation-delay:100ms]">
              <div className="w-10 h-10 bg-primary-pale rounded-xl flex items-center justify-center text-primary text-xl mb-3">
                <FontAwesomeIcon icon={faEye} />
              </div>
              <div className="text-3xl font-extrabold text-[#0f172a] leading-tight mb-1">
                {stats.totalReviewed.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-[#475569]">
                Total reviewed
              </div>
              <span className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#f97316]">
                <FontAwesomeIcon icon={faArrowDown} className="text-[9px]" />{" "}
                2.1% this week
              </span>
            </div>
          </div>

          {/* Applicant Jobs Card */}
          <div className="bg-white rounded-2xl py-[18px] px-5 mt-3 shadow-[0_2px_10px_rgba(15,30,80,0.06),0_0_0_1px_rgba(226,232,240,0.8)] border border-[rgba(226,232,240,0.9)] animate-fadeUp [animation-delay:150ms]">
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-[#0f172a]">
                  Applicant Jobs
                </h3>
                <span className="text-[10px] font-bold bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-primary border border-[#bfdbfe] rounded-full px-2.5 py-0.5">
                  <FontAwesomeIcon icon={faStar} className="mr-1" /> AI-powered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  onClick={handleFilterClick}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full py-1.5 px-3.5 text-xs font-semibold text-[#0f172a] flex items-center gap-2 cursor-pointer hover:bg-primary-pale hover:border-primary hover:text-primary transition-all select-none"
                >
                  <span>{filterText}</span>{" "}
                  <FontAwesomeIcon icon={faChevronDown} />
                </div>
                <div className="view-toggle flex bg-[#f1f5f9] rounded-full p-0.5">
                  <button
                    onClick={() => setViewMode("chart")}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-full flex items-center gap-1 ${viewMode === "chart" ? "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]" : "bg-transparent text-[#475569]"}`}
                  >
                    <FontAwesomeIcon icon={faChartBar} /> Chart
                  </button>
                  <button
                    onClick={() => setViewMode("globe")}
                    className={`px-3 py-1 text-[11px] font-semibold rounded-full flex items-center gap-1 ${viewMode === "globe" ? "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]" : "bg-transparent text-[#475569]"}`}
                  >
                    <FontAwesomeIcon icon={faGlobe} /> Globe
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#475569] mb-3">
              Total jobs applied by candidates in your company
            </p>
            <div className="flex gap-6 items-start">
              <div className="flex-[0_0_180px] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[38px] font-extrabold text-[#0f172a] leading-none tracking-tight">
                    9.42%
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    className="text-sm text-[#10b981] bg-[#ecfdf5] p-1 rounded-md"
                  />
                </div>
                <p className="text-xs text-[#475569] leading-relaxed mb-4">
                  We're seeing a steady increase in candidate applications every
                  week.
                </p>
                <div className="flex gap-2.5 mt-1 flex-nowrap">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569] whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-[#bfdbfe]"></span>{" "}
                    On-Site
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569] whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-[#60a5fa]"></span>{" "}
                    Hybrid
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#475569] whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2563eb]"></span>{" "}
                    Remote
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0 relative" style={{ height: 180 }}>
                <div
                  className={`chart-container ${viewMode === "chart" ? "" : "hidden"}`}
                >
                  <canvas ref={chartCanvasRef}></canvas>
                </div>
                <div
                  ref={globeContainerRef}
                  className={`globe-container rounded-xl overflow-hidden ${viewMode === "globe" ? "" : "hidden"}`}
                  style={{ height: 180 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Card */}
        <div className="flex flex-col h-full">
          <div
            className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_rgba(15,30,80,0.06),0_0_0_1px_rgba(226,232,240,0.8)] border border-[rgba(226,232,240,0.9)] flex flex-col min-h-0 overflow-hidden"
            style={{ height: 455 }}
          >
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className="text-primary-light"
                />{" "}
                Schedule
              </h3>
            </div>
            <div className="flex justify-between my-1 mb-4 flex-shrink-0 overflow-hidden">
              {dateStripDays().map((d, i) => (
                <div key={i} className="text-center flex-1">
                  <div className="text-[10px] text-[#94a3b8] uppercase mb-1">
                    {d.day}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto font-semibold text-[13px] ${d.isToday ? "bg-primary text-white font-bold" : "text-[#475569]"}`}
                  >
                    {d.date}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1 bg-[#f1f5f9] p-0.5 rounded-full mb-4 flex-shrink-0">
              {(["today", "tomorrow", "week"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 px-3 rounded-full font-semibold text-[11px] transition-all ${activeTab === tab ? "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]" : "bg-transparent text-[#475569]"}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {activeTab === "today" && (
                <>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider">
                      Pending
                    </span>
                    <div className="flex-1 h-px bg-[#f1f5f9]"></div>
                  </div>
                  <div className="bg-white rounded-xl p-3 mb-3 border border-[#f1f5f9] border-l-2 border-l-[#2563eb] hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-[#eff6ff] px-2 py-0.5 rounded-full mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse inline-block mr-0.5"></span>
                          <FontAwesomeIcon
                            icon={farClock}
                            className="text-[9px]"
                          />{" "}
                          09:00 - 09:30
                        </div>
                        <div className="font-bold text-[14px] mt-1 mb-0.5">
                          Thabo Ndlovu
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          30 min call meeting Peer & Leslie
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-1">
                          <FontAwesomeIcon icon={faCalendarAlt} /> 30 December
                          2025
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 bg-[#bfdbfe] text-[#1e3a8a]">
                        TN
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <span className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider">
                      Completed
                    </span>
                    <div className="flex-1 h-px bg-[#f1f5f9]"></div>
                  </div>
                  {["Lerato Khumalo", "Sipho Mahlangu", "Naledi Molefe"].map(
                    (name, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl p-3 mb-3 border border-[#f1f5f9] hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
                              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-[#eff6ff] px-2 py-0.5 rounded-full">
                                <FontAwesomeIcon
                                  icon={farCheckCircle}
                                  className="text-primary-light"
                                />{" "}
                                {
                                  [
                                    "10:30 - 11:00",
                                    "13:00 - 13:45",
                                    "15:30 - 16:00",
                                  ][i]
                                }
                              </div>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[10px] bg-[#ecfdf5] text-[#10b981]">
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  className="text-[8px] mr-1"
                                />
                                Complete
                              </span>
                            </div>
                            <div className="font-bold text-[14px] mt-1 mb-0.5">
                              {name}
                            </div>
                            <div className="text-[11px] text-[#94a3b8]">
                              {
                                [
                                  "Design review session",
                                  "Technical interview",
                                  "Follow-up call",
                                ][i]
                              }
                            </div>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${["bg-[#fde68a] text-[#92400e]", "bg-[#bbf7d0] text-[#166534]", "bg-[#fecaca] text-[#991b1b]"][i]}`}
                          >
                            {name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </>
              )}
              {activeTab === "tomorrow" && (
                <>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider">
                      Upcoming
                    </span>
                    <div className="flex-1 h-px bg-[#f1f5f9]"></div>
                  </div>
                  <div className="bg-white rounded-xl p-3 mb-3 border border-[#f1f5f9] hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition-all cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-[#eff6ff] px-2 py-0.5 rounded-full mb-1.5">
                          <FontAwesomeIcon icon={farClock} /> 11:00 - 12:00
                        </div>
                        <div className="font-bold text-[14px] mt-1 mb-0.5">
                          Kagiso Modise
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          Product walkthrough
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 bg-[#bfdbfe] text-[#1e3a8a]">
                        KM
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3 mb-2 border border-[#f1f5f9] hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition-all cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-[#eff6ff] px-2 py-0.5 rounded-full mb-1.5">
                          <FontAwesomeIcon icon={farClock} /> 14:00 - 14:45
                        </div>
                        <div className="font-bold text-[14px] mt-1 mb-0.5">
                          Amahle Dlamini
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          Initial screening
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 bg-[#fde68a] text-[#92400e]">
                        AD
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeTab === "week" && (
                <div className="bg-[#eff6ff] rounded-2xl p-5 mt-2 text-center">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-primary text-2xl shadow-sm">
                    <FontAwesomeIcon icon={faCalendarCheck} />
                  </div>
                  <h4 className="font-bold text-[15px] mb-1">
                    8 Interviews This Week
                  </h4>
                  <p className="text-xs text-[#475569] mb-3">
                    Across 5 candidates · 3 completed
                  </p>
                  <div className="bg-[#cbd5e1] h-1.5 rounded w-4/5 mx-auto overflow-hidden">
                    <div className="h-full bg-primary rounded w-[37.5%]"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Applied Table */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="font-bold text-base">Recently Applied</h3>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-full py-1 px-3.5 text-xs font-semibold cursor-pointer">
            Filter <FontAwesomeIcon icon={faChevronDown} />
          </div>
        </div>
        <p className="text-xs text-[#475569] mb-3">
          Candidates who recently applied to your open positions
        </p>
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(15,30,80,0.06),0_0_0_1px_rgba(226,232,240,0.8)] border border-[rgba(226,232,240,0.9)] overflow-x-auto">
          <table className="w-full border-collapse text-[13px] min-w-[1000px]">
            <thead>
              <tr>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider w-8">
                  <input type="checkbox" />
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faHashtag} className="mr-1.5" />
                  Candidate ID
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faUser} className="mr-1.5" />
                  Full Name
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faBriefcase} className="mr-1.5" />
                  Role
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faSignal} className="mr-1.5" />
                  Level
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={farStar} className="mr-1.5" />
                  AI Score
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faCalendar} className="mr-1.5" />
                  Date
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faCircle} className="mr-1.5" />
                  Status
                </th>
                <th className="text-left py-3.5 px-3 text-[#475569] font-semibold text-[11.5px] bg-[#f8fafc] border-b border-[#e2e8f0] uppercase tracking-wider">
                  <FontAwesomeIcon icon={faCog} className="mr-1.5" />
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="hover:bg-[#f8faff]">
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    <input type="checkbox" />
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    #{c.id}
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    {c.name}
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    {c.role}
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    {c.level}
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        c.aiScore >= 80
                          ? "bg-[#ecfdf5] text-[#059669]"
                          : c.aiScore >= 60
                            ? "bg-[#fef9c3] text-[#92400e]"
                            : "bg-[#fee2e2] text-[#b91c1c]"
                      }`}
                    >
                      {c.aiScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    {c.date}
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        c.status === "Active"
                          ? "bg-[#eff6ff] text-[#1d4ed8]"
                          : c.status === "Pending"
                            ? "bg-[#fef9c3] text-[#92400e]"
                            : "bg-[#fee2e2] text-[#b91c1c]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 border-b border-[#f1f5f9]">
                    <button className="text-primary font-semibold bg-primary-pale border-0 cursor-pointer px-3 py-1 rounded-full text-xs hover:bg-primary hover:text-white transition-all">
                      <FontAwesomeIcon icon={faEye} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center py-3.5 px-4 text-xs text-[#94a3b8]">
            <span>Showing 1–5 of 24 results</span>
            <div className="flex gap-2">
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-3.5 font-semibold text-[11px] text-[#0f172a] cursor-pointer hover:border-primary hover:text-primary transition-all">
                Prev
              </button>
              <button className="bg-transparent border border-[#e2e8f0] rounded-full py-1.5 px-3.5 font-semibold text-[11px] text-[#0f172a] cursor-pointer hover:border-primary hover:text-primary transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
