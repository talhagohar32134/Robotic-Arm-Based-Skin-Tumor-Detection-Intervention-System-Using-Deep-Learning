import { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";

interface ArmState {
  yaw: number;
  pitch: number;
  roll: number;
  biopsyExtension: number;
}

interface RoboticArmProps {
  armState: ArmState;
}

// Color palette - Matching physical hardware intensely
const ORANGE_MATTE = "#ff6a00";
const BASE_BLACK = "#1a1a1a";
const JOINT_BLACK = "#111111";
const SCREW_SILVER = "#d0d0d0";
const CAMERA_BOARD_BLACK = "#222222";
const CAMERA_LENS = "#2a3a4a";
const NEEDLE_SILVER = "#e0e8f0";
const PLASTIC_BLUE = "#33bbff";

const RoboticArmModel = ({ armState }: RoboticArmProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // High realism materials to emulate precise rapid-prototyping plastics
  const plasticMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: ORANGE_MATTE, roughness: 0.4, metalness: 0.15 }), []);
  const darkPlasticMat = useMemo(() => new THREE.MeshStandardMaterial({ color: BASE_BLACK, roughness: 0.7, metalness: 0.1 }), []);
  const blackMetalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: JOINT_BLACK, roughness: 0.3, metalness: 0.8 }), []);
  
  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* 1. FLANGED CURVED BASE */}
      {/* Using a hemisphere for a flawless, sweeping bell-curve base matching the photo exactly! */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0, 0]} scale={[1, 0.8, 1]}>
           <sphereGeometry args={[0.38, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
           <primitive object={darkPlasticMat} attach="material" />
        </mesh>
        
        {/* Central rising collar of the base */}
        <mesh position={[0, 0.28, 0]}>
           <cylinderGeometry args={[0.22, 0.24, 0.1, 64]} />
           <primitive object={darkPlasticMat} attach="material" />
        </mesh>

        {/* Base corner anchors for realism */}
        {[0, 1, 2, 3].map((i) => {
          const angle = i * Math.PI / 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.3, 0.15, Math.sin(angle) * 0.3]}>
              <cylinderGeometry args={[0.04, 0.05, 0.04, 32]} />
              <meshStandardMaterial color={BASE_BLACK} roughness={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* 2. YAW PLATFORM */}
      <group rotation={[0, armState.yaw, 0]} position={[0, 0.36, 0]}>
        {/* Smooth thick orange platter */}
        <mesh position={[0, 0, 0]}>
           <cylinderGeometry args={[0.21, 0.21, 0.06, 64]} />
           <primitive object={plasticMaterial} attach="material" />
        </mesh>

        {/* Pitch U-Bracket - Extremely rounded side-plates holding shoulder */}
        <mesh position={[0.16, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
           <cylinderGeometry args={[0.16, 0.16, 0.08, 64]} />
           <primitive object={plasticMaterial} attach="material" />
        </mesh>
        <mesh position={[-0.16, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
           <cylinderGeometry args={[0.16, 0.16, 0.08, 64]} />
           <primitive object={plasticMaterial} attach="material" />
        </mesh>
        {/* Solid floor bridging the U-Bracket */}
        <mesh position={[0, 0.05, -0.06]}>
           <boxGeometry args={[0.24, 0.15, 0.16]} />
           <primitive object={plasticMaterial} attach="material" />
        </mesh>

        {/* 3. SHOULDER PITCH LINK */}
        <group position={[0, 0.15, 0]} rotation={[armState.pitch, 0, 0]}>
          {/* Inner metallic joint hardware */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
             <cylinderGeometry args={[0.1, 0.1, 0.36, 64]} />
             <primitive object={blackMetalMat} attach="material" />
          </mesh>

          {/* LOWER ARM STRUCTURE */}
          <group position={[0, 0, 0]}>
             {/* Sweeping full cylinder wrapping the shoulder servo axis */}
             <mesh rotation={[0, 0, Math.PI / 2]}>
               <cylinderGeometry args={[0.14, 0.14, 0.24, 64]} />
               <primitive object={plasticMaterial} attach="material" />
             </mesh>
             
             {/* The Arm Body: Perfectly smooth conical oval shape (scale Z to deep oval) */}
             <mesh position={[0, 0.35, 0]} scale={[1, 1, 1.3]}>
                <cylinderGeometry args={[0.1, 0.14, 0.7, 64]} />
                <primitive object={plasticMaterial} attach="material" />
             </mesh>

             {/* The distinct black rectangle servo cutout on the arm's side! */}
             <mesh position={[0.11, 0.25, 0]} rotation={[0, 0, Math.PI/32]}>
                <boxGeometry args={[0.04, 0.16, 0.08]} />
                <primitive object={darkPlasticMat} attach="material" />
             </mesh>

             {/* Thick top elbow joint housing */}
             <mesh position={[0, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.12, 0.12, 0.26, 64]} />
                <primitive object={plasticMaterial} attach="material" />
             </mesh>
          </group>

          {/* 4. ELBOW PITCH LINK */}
          <group position={[0, 0.7, 0]} rotation={[armState.roll, 0, 0]}>
             {/* Inner elbow joint cylinder showing dark mechanics */}
             <mesh rotation={[0, 0, Math.PI / 2]}>
               <cylinderGeometry args={[0.09, 0.09, 0.32, 64]} />
               <primitive object={blackMetalMat} attach="material" />
             </mesh>

             {/* UPPER ARM (Forearm) - Impossibly curved and hollowed out channel */}
             <group position={[0, 0, 0]}>
                
                {/* Stunning spherical hood overlapping the joint for structural aesthetics */}
                <mesh position={[0, 0.02, -0.04]} scale={[1.2, 1.2, 1.5]}>
                   <sphereGeometry args={[0.11, 32, 32]} />
                   <primitive object={plasticMaterial} attach="material" />
                </mesh>

                {/* Highly refined tapering forearm structure */}
                <mesh position={[0, 0.3, 0]} scale={[1, 1, 1.2]}>
                    <cylinderGeometry args={[0.08, 0.13, 0.6, 64]} />
                    <primitive object={plasticMaterial} attach="material" />
                </mesh>
                
                {/* Masterful carving of the trough "canoe" effect using a massive hollow cylinder intersection */}
                <mesh position={[0, 0.35, 0.06]} rotation={[Math.PI / 32, 0, 0]}>
                    <cylinderGeometry args={[0.06, 0.12, 0.55, 64]} />
                    <meshStandardMaterial color="#110500" roughness={0.9} />
                </mesh>

                {/* Clearly exposed black servo motor core nested at the top of the trough */}
                <mesh position={[0, 0.58, 0.02]}>
                    <boxGeometry args={[0.11, 0.14, 0.09]} />
                    <primitive object={blackMetalMat} attach="material" />
                </mesh>

                {/* Final wrist axis cover cylinder */}
                <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.08, 0.08, 0.22, 64]} />
                    <primitive object={plasticMaterial} attach="material" />
                </mesh>
             </group>

             {/* 5. WRIST ASSEMBLY & EXACT END EFFECTOR PLACEMENT */}
             <group position={[0, 0.6, 0]}>
                 
                 {/* The Orange structural bracket pulling down from the RIGHT side */}
                 <mesh position={[0.13, -0.08, 0]}>
                     <boxGeometry args={[0.04, 0.24, 0.14]} />
                     <primitive object={plasticMaterial} attach="material" />
                 </mesh>

                 {/* The strong horizontal plate coming underneath */}
                 <mesh position={[0, -0.18, 0]}>
                     <boxGeometry args={[0.3, 0.04, 0.16]} />
                     <primitive object={plasticMaterial} attach="material" />
                 </mesh>

                 {/* The Forward-Facing Motor Block (Definitive Roll Axis) */}
                 <group position={[0, -0.14, 0.05]}>
                    {/* The dense Black Servo mechanism body pointing entirely Forward (+Z) */}
                    <mesh position={[0, 0.04, -0.05]}>
                        <boxGeometry args={[0.16, 0.16, 0.2]} />
                        <primitive object={darkPlasticMat} attach="material" />
                    </mesh>

                    {/* FULL FRONT ARRAY: Pi Camera securely mounted exactly BELOW the white servo gear */}
                    <group position={[0, 0.04, 0.08]}>
                        
                        {/* Orange rounded guard face explicitly attached to front plane */}
                        <mesh position={[0, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.08, 0.08, 0.04, 64]} />
                            <primitive object={plasticMaterial} attach="material" />
                        </mesh>
                        <mesh position={[0, -0.05, 0]}>
                            <boxGeometry args={[0.16, 0.1, 0.04]} />
                            <primitive object={plasticMaterial} attach="material" />
                        </mesh>
                        
                        {/* The PI CAMERA directly attached to the lower front (Below the biopsy part) */}
                        <mesh position={[0, -0.06, 0.04]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.04, 0.04, 0.03, 64]} />
                            <meshStandardMaterial color={CAMERA_LENS} metalness={0.9} roughness={0.1}/>
                        </mesh>
                        <mesh position={[0, -0.06, 0.057]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.015, 0.015, 0.01, 32]} />
                            <meshStandardMaterial color="#000000" metalness={1} />
                        </mesh>

                        {/* White Servo Gear (Output Hub at the top section of the block) */}
                        <mesh position={[0, 0.0, 0.04]} rotation={[Math.PI/2, 0, 0]}>
                            <cylinderGeometry args={[0.045, 0.045, 0.015, 64]} />
                            <meshStandardMaterial color="#eeeeee" />
                        </mesh>

                        {/* BIOPSY SYRINGE: Sticking flawlessly out of the exact center point of the white gear */}
                        <group position={[0, 0.0, 0.05]} rotation={[Math.PI/2, 0, 0]}>
                            
                            {/* Medical Clear Outer Casing */}
                            <mesh position={[0, 0.12, 0]}>
                                <cylinderGeometry args={[0.018, 0.018, 0.24, 32]} />
                                <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
                            </mesh>
                            
                            {/* Inner active plunger mechanism pushing away from front plane */}
                            <mesh position={[0, 0 - (armState.biopsyExtension * 0.15), 0]}>
                                <cylinderGeometry args={[0.008, 0.008, 0.1, 32]} />
                                <meshStandardMaterial color="#eeeeee" />
                            </mesh>
                            <mesh position={[0, -0.06 - (armState.biopsyExtension * 0.15), 0]}>
                                <cylinderGeometry args={[0.02, 0.02, 0.02, 32]} />
                                <meshStandardMaterial color="#cccccc" />
                            </mesh>
                            
                            {/* Distinct Plastic Hub tightly gripped holding needle */}
                            <mesh position={[0, 0.25, 0]}>
                                <cylinderGeometry args={[0.012, 0.014, 0.06, 32]} />
                                <meshStandardMaterial color={PLASTIC_BLUE} />
                            </mesh>
                            
                            {/* Biopsy Core Needle extruding straight to absolute front */}
                            <mesh position={[0, 0.38 + (armState.biopsyExtension * 0.06), 0]}>
                                <cylinderGeometry args={[0.002, 0.002, 0.28, 16]} />
                                <meshStandardMaterial color={NEEDLE_SILVER} metalness={1} roughness={0.1} />
                            </mesh>
                        </group>
                    </group>
                 </group>
             </group>
          </group>
        </group>
      </group>
    </group>
  );
};

export const RoboticArm3D = ({ armState }: RoboticArmProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#050510] to-[#0a1428] rounded-xl overflow-hidden relative">
      <Canvas
        camera={{ position: [3.5, 2.5, 4.0], fov: 40 }}
        className="w-full h-full"
      >
        <color attach="background" args={["#080818"]} />

        {/* Soft, professional lighting setup */}
        <ambientLight intensity={0.7} color="#e6edf5" />
        <directionalLight position={[5, 10, 5]} intensity={1.8} color="#ffffff" castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.9} color="#b0c4de" />
        <spotLight position={[0, 8, 2]} angle={0.5} penumbra={0.8} intensity={1.5} color="#ffffff" castShadow />

        <RoboticArmModel armState={armState} />

        {/* Floor grid */}
        <Grid
          args={[20, 20]}
          position={[0, -0.4, 0]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1e3a5f"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#2563eb"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid={true}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.0}
          maxDistance={8}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0.6, 0]}
        />
      </Canvas>
      {/* Decorative overlaid elements */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-white/70 font-mono tracking-wider">LIVE 3D RENDER</span>
        </div>
      </div>
    </div>
  );
};
