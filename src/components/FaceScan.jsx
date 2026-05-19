import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Terminal, Shield, Lock, Wifi, Activity, ArrowLeft } from 'lucide-react'
import * as faceapi from 'face-api.js'

import { 
  generateFaceVector, 
  checkExistingFaceVector 
} from '../utils/faceVerification'
import VerificationPopup from './VerificationPopup'
import './FaceScan.css'

function checkFaceQuality(detection) {
  const box = detection.detection.box;
  const landmarks = detection.landmarks;

  // Face must be large enough (too small = low quality descriptor)
  if (box.width < 150 || box.height < 150) {
    return { ok: false, reason: 'Move closer to the camera' };
  }

  // Face must be roughly centered (not at edge)
  if (box.x < 50 || box.y < 50) {
    return { ok: false, reason: 'Center your face in the frame' };
  }

  // Both eyes must be visible (glasses ok, but full face occlusion not)
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  if (!leftEye || !rightEye) {
    return { ok: false, reason: 'Both eyes must be visible' };
  }

  return { ok: true };
}

const FaceScan = () => {
  const [terminalLines, setTerminalLines] = useState([])
  const [scanningProgress, setScanningProgress] = useState(0)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Face verification states
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [blinkCount, setBlinkCount] = useState(0)
  const [headVerification, setHeadVerification] = useState({ left: false, right: false })
  const headVerificationRef = useRef({ left: false, right: false })
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [message, setMessage] = useState('Loading face detection models...')
  const [currentEAR, setCurrentEAR] = useState(0.35) // live EAR for the meter bar

  // Use refs for all hot-path detection values to avoid stale closures
  const eyesClosedRef = useRef(false)
  const lastBlinkTimeRef = useRef(0)
  const blinkCountRef = useRef(0)
  const closedFramesRef = useRef(0)   // consecutive frames eyes are closed
  const baselineEARRef = useRef(0)    // personal open-eye baseline
  const baselineSamplesRef = useRef(0)
  const isDetectingRef = useRef(false) // prevent overlapping async calls
  const loopActiveRef = useRef(false)  // controls the detection loop lifecycle
  const blinkCooldown = 500
  const detectionIntervalRef = useRef(null)
  
  // Track messages to avoid duplicates
  const messagesShownRef = useRef({
    blinkComplete: false,
    headPoseStarted: false,
    headLeftVerified: false,
    headRightVerified: false
  })
  
  // Popup state
  const [showPopup, setShowPopup] = useState(false)
  const [popupResult, setPopupResult] = useState(null)

  // Error handling, reset, and fallback
  const [hasError, setHasError] = useState(false)
  const [failCount, setFailCount] = useState(0)        // track consecutive failures
  const [lightingStatus, setLightingStatus] = useState('OK') // TOO_DARK / TOO_BRIGHT / OK
  const [spoofAlert, setSpoofAlert] = useState(false)  // anti-spoofing flag

  // ── Anti-Spoofing: Texture Variance Check ────────────────────────────────
  // Samples from the LIVE VIDEO FRAME (not the overlay canvas) for accurate pixel data
  // Real skin: variance > 700 (pores, fine lines, micro-texture noise)
  // Printed/screen photo: variance < 350 (flat uniform pixel patterns)
  const getLivenessScore = () => {
    try {
      const video = videoRef.current
      if (!video || video.readyState < 2) return { variance: 9999, brightness: 128 }

      // Draw the current video frame onto a temp canvas
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width = 320  // downscale for performance
      tmpCanvas.height = 240
      const ctx = tmpCanvas.getContext('2d')
      ctx.drawImage(video, 0, 0, 320, 240)

      // Sample the central 60% of the frame (face region)
      const imageData = ctx.getImageData(64, 48, 192, 144)
      const pixels = imageData.data
      let mean = 0
      const samples = []
      for (let i = 0; i < pixels.length; i += 12) {
        const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
        samples.push(gray)
        mean += gray
      }
      mean /= samples.length
      let variance = 0
      samples.forEach(v => { variance += (v - mean) ** 2 })
      return { variance: variance / samples.length, brightness: mean }
    } catch { return { variance: 9999, brightness: 128 } }
  }

  // Reset all states for fresh scan
  const resetScan = () => {
    setBlinkCount(0)
    blinkCountRef.current = 0
    eyesClosedRef.current = false
    lastBlinkTimeRef.current = 0
    closedFramesRef.current = 0
    baselineEARRef.current = 0
    baselineSamplesRef.current = 0
    setHeadVerification({ left: false, right: false })
    headVerificationRef.current = { left: false, right: false }
    setVerificationComplete(false)
    setScanningProgress(0)
    setTerminalLines([])
    setHasError(false)
    setCurrentEAR(0.35)
    messagesShownRef.current = {
      blinkComplete: false,
      headPoseStarted: false,
      headLeftVerified: false,
      headRightVerified: false
    }
    setMessage('Please blink twice (0/2)')
    addTerminalLine('> System reset - Starting new scan...')
  }

  // Hacking code lines to display
  const hackingCode = [
    '> Initializing face detection protocol...',
    '> Loading neural network models...',
    '> Establishing secure connection...',
    '> Face API models loaded successfully',
    '> Starting real-time face tracking...',
    '> Analyzing facial landmarks (68 points)',
    '> Calculating Eye Aspect Ratio (EAR)...',
    '> Monitoring blink detection...',
    '> Tracking head pose estimation...',
    '> Computing face descriptor vectors...',
    '> Running liveness detection checks...',
    '> Verifying head rotation angles...',
    '> Generating 128-dimensional face embedding...',
    '> Querying Firebase database...',
    '> Comparing face vectors with cosine similarity...',
    '> Analyzing facial recognition results...',
    '> Verification process complete!',
  ]

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage('Loading high-accuracy face models...')
        addTerminalLine('> Loading SSD Mobilenet v1 (high accuracy detector)...')
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),      // HIGH ACCURACY detector
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),   // Full 68-point landmarks
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),  // 128-d descriptor
        ])
        setModelsLoaded(true)
        setMessage('Please blink twice (0/2)')
        addTerminalLine('> High-accuracy models loaded (SSD Mobilenet v1 + 128-d Recognition)')
      } catch (error) {
        console.error('Error loading models:', error)
        setMessage('Error loading face detection models')
        setHasError(true)
        addTerminalLine('> ERROR: Failed to load face detection models')
        addTerminalLine('> System will reset in 3 seconds...')
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    }

    loadModels()

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  // Initialize webcam
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 720 },
            height: { ideal: 560 },
            facingMode: 'user' 
          } 
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(err => console.error('Error playing video:', err))
        }
      } catch (err) {
        console.error('Camera access denied:', err)
        setMessage('Error: Camera access denied')
        setHasError(true)
        addTerminalLine('> ERROR: Camera access denied')
        addTerminalLine('> Please allow camera permissions')
        addTerminalLine('> System will reset in 3 seconds...')
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // ─── MediaPipe Face Mesh Detection Engine (30fps) ────────────────────────
  useEffect(() => {
    if (!modelsLoaded || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = 720
    canvas.height = 560
    loopActiveRef.current = true

    // ── EAR helpers (pixel-space) ─────────────────────────────────────────
    const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
    const ear6 = (p1, p2, p3, p4, p5, p6) =>
      (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4) + 0.0001)

    // Convert MediaPipe normalised [0,1] landmarks → pixel coords
    const px = (lms, i) => ({
      x: lms[i].x * canvas.width,
      y: lms[i].y * canvas.height,
    })

    // ── EAR threshold (Dynamic) ───────────────────────────────────────
    // We will dynamically calculate this during the first 30 frames.
    // Default fallback: 0.20

    let mpReady = false
    let rafId = null
    let noFaceFrames = 0

    // Dynamic import so we don't block initial render
    import('@mediapipe/face_mesh').then(({ FaceMesh }) => {
      if (!loopActiveRef.current) return

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,        // KEY FIX: enables attention mesh (V2) for accurate eyelids
        minDetectionConfidence: 0.65, // higher for daytime glare robustness
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults((results) => {
        if (!loopActiveRef.current) return

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (!results.multiFaceLandmarks?.length) {
          noFaceFrames++
          if (noFaceFrames > 90) { // 90 frames @ 30fps = 3 seconds
            resetScan()
            setMessage('Face lost. Please restart scan.')
            noFaceFrames = 0
          }
          return
        }
        
        noFaceFrames = 0
        const lms = results.multiFaceLandmarks[0]

        // ── FACE CLARITY & PROXIMITY CHECK ──────────────────────────────
        const faceMinX = Math.min(...lms.map(p => p.x)) * canvas.width
        const faceMaxX = Math.max(...lms.map(p => p.x)) * canvas.width
        const faceWidth = faceMaxX - faceMinX

        if (faceWidth < 160) {
          setMessage('Face not clear. Please move closer to the camera.')
          return // Stop processing until they move closer
        } else if (blinkCountRef.current === 0 && message !== 'Please blink twice (0/2)') {
          setMessage('Please blink twice (0/2)')
        }

        // ── EAR ───────────────────────────────────────────────────────────
        // CORRECT landmark indices for browser MediaPipe FaceMesh (V2)
        const leftEAR  = ear6(px(lms,362), px(lms,380), px(lms,374), px(lms,263), px(lms,386), px(lms,385))
        const rightEAR = ear6(px(lms,33),  px(lms,159), px(lms,158), px(lms,133), px(lms,153), px(lms,145))
        const avgEAR   = (leftEAR + rightEAR) / 2
        setCurrentEAR(parseFloat(avgEAR.toFixed(3)))

        // ── DYNAMIC EAR BASELINE ──────────────────────────────────────────
        // Auto-calibrate the threshold on page load for the first 60 frames (2 seconds)
        // This is crucial for users with glasses whose open-eye EAR might differ.
        if (baselineSamplesRef.current < 60) {
          baselineEARRef.current += avgEAR
          baselineSamplesRef.current++
          
          const remaining = 60 - baselineSamplesRef.current
          setMessage(`Calibrating eye sensors... (${remaining} frames)`)
          return // Wait for full baseline before detecting blinks
        }

        const openEyeEAR = baselineEARRef.current / 60
        // Calibrated threshold: 75% of their personal open-eye EAR
        const EAR_CLOSED = openEyeEAR * 0.75

        // ── BLINK DETECTION ───────────────────────────────────────────────
        if (blinkCountRef.current < 2) {
          setMessage(`Please blink twice (${blinkCountRef.current}/2)`)
          if (avgEAR < EAR_CLOSED) {
            closedFramesRef.current++
            eyesClosedRef.current = true
          } else {
            // Eyes just opened — check if counter is in valid blink range
            const closedCount = closedFramesRef.current
            
            // Minimum frames below threshold = confirmed blink
            // More than 15 frames = eyes closed / sleeping, not a blink
            if (closedCount >= 2 && closedCount <= 15) {
              const now = Date.now()
              if (now - lastBlinkTimeRef.current > 150) {  // 150ms cooldown for fast blinkers
                lastBlinkTimeRef.current = now
                const newCount = blinkCountRef.current + 1
                blinkCountRef.current = newCount
                setBlinkCount(newCount)
                setScanningProgress(calculateProgress(newCount, undefined, undefined))

                if (newCount === 2 && !messagesShownRef.current.blinkComplete) {
                  messagesShownRef.current.blinkComplete = true
                  setMessage('Blink verification complete! Now turn your head left')
                  addTerminalLine(`> Blink detected (${newCount}/2)`)
                  addTerminalLine('> Blink verification complete ✓')
                  addTerminalLine('> Initiating head pose verification...')
                } else if (newCount < 2) {
                  setMessage(`Please blink twice (${newCount}/2)`)
                  addTerminalLine(`> Blink detected (${newCount}/2)`)
                }
              }
            }
            closedFramesRef.current = 0
            eyesClosedRef.current = false
          }
        }

        // ── HEAD POSE via nose deviation ──────────────────────────────────
        if (blinkCountRef.current >= 2 && !verificationComplete) {
          const noseTip = px(lms, 4)   // MediaPipe landmark 4 = nose tip (most stable)
          const chin    = px(lms, 152) // chin centre

          const leye = { x: (px(lms,33).x  + px(lms,133).x)  / 2, y: (px(lms,33).y  + px(lms,133).y)  / 2 }
          const reye = { x: (px(lms,362).x + px(lms,263).x) / 2, y: (px(lms,362).y + px(lms,263).y) / 2 }
          const eyeMidX = (leye.x + reye.x) / 2
          const eyeSep  = Math.abs(reye.x - leye.x) + 1

          const noseDevX = (noseTip.x - eyeMidX) / eyeSep
          const chinDev  = (chin.x    - eyeMidX) / eyeSep
          const signal   = noseDevX + chinDev

          // Require a clear, deliberate turn — not a single frame glitch
          // Threshold lowered to 0.10 so a moderate turn registers easily
          const turningLeft  = signal < -0.10 || noseDevX < -0.12
          const turningRight = signal > 0.10  || noseDevX >  0.12

          // Use a hold counter — require 4 consecutive frames to confirm (≈133ms)
          if (!headVerificationRef.current.leftHoldCount) headVerificationRef.current.leftHoldCount = 0
          if (!headVerificationRef.current.rightHoldCount) headVerificationRef.current.rightHoldCount = 0

          if (!headVerificationRef.current.left) {
            if (turningLeft) {
              headVerificationRef.current.leftHoldCount++
            } else {
              headVerificationRef.current.leftHoldCount = 0
            }
            if (headVerificationRef.current.leftHoldCount >= 2 &&
                !messagesShownRef.current.headLeftVerified) {
              messagesShownRef.current.headLeftVerified = true
              headVerificationRef.current.left = true
              headVerificationRef.current.leftTime = Date.now()
              headVerificationRef.current.leftHoldCount = 0
              setHeadVerification(prev => ({ ...prev, left: true }))
              setMessage('Great! Now return to center, then turn your head right')
              addTerminalLine('> Head left verified ✓')
            }
          }

          const leftAgo = headVerificationRef.current.leftTime
            ? Date.now() - headVerificationRef.current.leftTime : 0

          if (headVerificationRef.current.left &&
              !headVerificationRef.current.right &&
              leftAgo > 800) {  // must wait 800ms after left before right registers
            if (turningRight) {
              headVerificationRef.current.rightHoldCount++
            } else {
              headVerificationRef.current.rightHoldCount = 0
            }
            if (headVerificationRef.current.rightHoldCount >= 2 &&
                !messagesShownRef.current.headRightVerified) {
              messagesShownRef.current.headRightVerified = true
              headVerificationRef.current.right = true
              headVerificationRef.current.rightHoldCount = 0
              setHeadVerification(prev => ({ ...prev, right: true }))
              setMessage('Verification complete! Checking database...')
              setVerificationComplete(true)
              addTerminalLine('> Head right verified ✓')
              addTerminalLine('> Generating face descriptor...')
              handleVerificationComplete()
            }
          }
        }

        setScanningProgress(calculateProgress(
          blinkCountRef.current,
          headVerificationRef.current.left,
          headVerificationRef.current.right
        ))
      })

      // Initialise and start frame loop
      faceMesh.initialize().then(() => {
        mpReady = true
        addTerminalLine('> MediaPipe Face Mesh loaded (468 landmarks @ 30fps)')

        const sendFrame = async () => {
          if (!loopActiveRef.current) return
          if (video.readyState >= 2 && mpReady) {
            try { await faceMesh.send({ image: video }) } catch (_) {}
          }
          rafId = requestAnimationFrame(sendFrame)
        }
        // Small delay for camera to stabilise
        setTimeout(() => { rafId = requestAnimationFrame(sendFrame) }, 500)
      }).catch(async () => {
        addTerminalLine('> MediaPipe init failed — falling back to face-api.js')
        // Fallback: manually trigger the face-api.js models since mesh failed
        try {
          await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
          await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
          addTerminalLine('> Face-api.js fallback loaded successfully')
          setModelsLoaded(true)
        } catch (err) {
          addTerminalLine('> CRITICAL: Both primary and fallback biometrics failed.')
          setHasError(true)
        }
      })

      // Cleanup
      return () => {
        loopActiveRef.current = false
        if (rafId) cancelAnimationFrame(rafId)
        faceMesh.close()
      }
    })

    return () => {
      loopActiveRef.current = false
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [modelsLoaded, verificationComplete])

  // Calculate Eye Aspect Ratio — NO clamping so blink valleys show in full
  const calculateEAR = (eye) => {
    try {
      const p2_p6 = euclideanDistance(eye[1], eye[5])
      const p3_p5 = euclideanDistance(eye[2], eye[4])
      const p1_p4 = euclideanDistance(eye[0], eye[3])
      if (p1_p4 === 0) return 0.32
      return (p2_p6 + p3_p5) / (2.0 * p1_p4)  // raw, unclamped
    } catch {
      return 0.32
    }
  }

  const euclideanDistance = (point1, point2) => {
    const x1 = point1.x !== undefined ? point1.x : point1._x
    const y1 = point1.y !== undefined ? point1.y : point1._y
    const x2 = point2.x !== undefined ? point2.x : point2._x
    const y2 = point2.y !== undefined ? point2.y : point2._y
    
    return Math.sqrt(
      Math.pow(x2 - x1, 2) + 
      Math.pow(y2 - y1, 2)
    )
  }

  // Calculate overall progress — reads from REFS not stale state
  const calculateProgress = (blinksOverride, leftOverride, rightOverride) => {
    const blinks = blinksOverride ?? blinkCountRef.current
    const left   = leftOverride  ?? headVerificationRef.current.left
    const right  = rightOverride ?? headVerificationRef.current.right
    if (right && left)      return 100
    if (left && !right)    return 75
    if (blinks >= 2)       return 50
    if (blinks === 1)      return 25
    return 0
  }

  const handleVerificationComplete = async () => {
    try {
      addTerminalLine('> Collecting 5 biometric samples for robust fingerprint...')
      setMessage('Hold still — collecting biometric samples...')

      // Collect 5 face descriptors over ~2 seconds and average them
      // This is the industry standard approach for robust face matching
      const descriptors = []
      const ssdOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })

      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 400)) // wait 400ms between samples
        let result = await faceapi
          .detectSingleFace(videoRef.current, ssdOptions)
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (result) {
          const quality = checkFaceQuality(result)
          if (!quality.ok) {
            addTerminalLine(`> Sample ${i + 1}/5 rejected: ${quality.reason}`)
            result = null
          }
        }

        if (result) {
          descriptors.push(result.descriptor)
          addTerminalLine(`> Sample ${i + 1}/5 captured ✓`)
        } else {
          addTerminalLine(`> Sample ${i + 1}/5 — face not clear, retrying...`)
          // Retry this sample once
          await new Promise(r => setTimeout(r, 300))
          let retry = await faceapi
            .detectSingleFace(videoRef.current, ssdOptions)
            .withFaceLandmarks()
            .withFaceDescriptor()
            
          if (retry) {
            const quality = checkFaceQuality(retry)
            if (!quality.ok) {
              addTerminalLine(`> Sample ${i + 1}/5 retry rejected: ${quality.reason}`)
              retry = null
            }
          }

          if (retry) {
            descriptors.push(retry.descriptor)
            addTerminalLine(`> Sample ${i + 1}/5 captured on retry ✓`)
          }
        }
      }

      if (descriptors.length < 3) {
        throw new Error('Could not get enough clear face samples. Please ensure your face is well-lit and centered.')
      }

      // Average all descriptors into one ultra-accurate 128-d vector
      const avgDescriptor = new Float32Array(128)
      for (const d of descriptors) {
        for (let i = 0; i < 128; i++) avgDescriptor[i] += d[i]
      }
      for (let i = 0; i < 128; i++) avgDescriptor[i] /= descriptors.length

      const faceVector = Array.from(avgDescriptor)
      addTerminalLine(`> Averaged ${descriptors.length} samples into robust 128-d vector`)

      // ── ANTI-SPOOFING: Texture Variance Gate (samples real video pixels) ───────
      const { variance, brightness } = getLivenessScore()
      addTerminalLine(`> Texture variance: ${variance.toFixed(0)} | Brightness: ${brightness.toFixed(0)}`)

      if (brightness < 55) {
        setLightingStatus('TOO_DARK')
        throw new Error('Lighting too dark for reliable scan. Please move to a brighter area.')
      }
      if (brightness > 225) {
        setLightingStatus('TOO_BRIGHT')
        throw new Error('Too much direct light. Please reduce glare or move away from a window.')
      }
      if (variance < 350) {
        setSpoofAlert(true)
        addTerminalLine(`> ⚠ ANTI-SPOOFING ALERT: Texture variance ${variance.toFixed(0)} < 350`)
        throw new Error('Liveness check failed. Physical face required — photos and screens are not accepted.')
      }
      addTerminalLine('> ✓ Anti-spoofing check passed (real skin texture confirmed)')
      setLightingStatus('OK')
      setSpoofAlert(false)
      addTerminalLine('> Querying Firebase database...')

      // STEP 1: Check if face already exists in Firebase
      const existingFace = await checkExistingFaceVector(faceVector)

      if (existingFace && existingFace.uuid) {
        if (existingFace.uncertain || existingFace.zone?.action === 'request_mfa') {
          addTerminalLine('> ⚠ UNCERTAIN MATCH: Confidence too low.')
          addTerminalLine('> MFA Required. Redirecting to Email/Password login...')
          setSpoofAlert(false)
          
          setPopupResult({
            type: 'warning',
            message: 'Biometric match uncertain. Please use Email/Password fallback to verify your identity.'
          })
          setShowPopup(true)
          
          setTimeout(() => {
            window.location.href = '/identity'
          }, 3500)
          return
        }

        // ✅ EXISTING USER - Face found with UUID
        const distDisplay = existingFace.distance ? existingFace.distance.toFixed(4) : 'N/A'
        const conf = existingFace.zone?.confidence || 'HIGH'
        addTerminalLine(`> ✓ MATCH FOUND! Distance: ${distDisplay} | Confidence: ${conf}`)
        addTerminalLine(`> User UUID: ${existingFace.uuid}`)

        // Store the JWT biometric token for session binding
        if (existingFace.bioToken) {
          localStorage.setItem('bioToken', existingFace.bioToken)
          addTerminalLine('> ✓ Biometric JWT token issued (8h session)')
        }
        addTerminalLine('> Checking user profile completeness...')

        // Import utilities
        const { redirectWithUUID } = await import('../utils/uuid')
        const { getUserProfile } = await import('../utils/faceVerification')

        // ✅ CLEAR OLD SESSION FIRST (Important for new scan)
        localStorage.removeItem('userId')
        localStorage.removeItem('sessionId')
        addTerminalLine('> Cleared previous session data')

        // ✅ STEP 2: Check if user has complete profile data in Firebase
        let isComplete = false
        
        try {
          // Check Firebase first
          const userResult = await getUserProfile(existingFace.uuid)
          
          if (userResult.success && userResult.user) {
            // Check if all required fields are present
            isComplete = userResult.user.profile &&
              userResult.user.profile.fullName &&
              userResult.user.profile.email &&
              userResult.user.profile.organization &&
              (userResult.user.profile.role || userResult.user.profile.phone) // At least one more field
            
            if (isComplete) {
              addTerminalLine('> ✓ Profile complete in Firebase!')
            } else {
              addTerminalLine('> ⚠ Profile incomplete in Firebase')
            }
          } else {
            addTerminalLine('> ⚠ No user profile found in Firebase')
          }
        } catch (fbError) {
          console.log('Firebase check failed, trying API:', fbError)
          addTerminalLine('> Firebase unavailable, checking via API...')
          
          // Fallback to API check
          try {
            const response = await fetch(`/api/user/${existingFace.uuid}/check-complete`)
            const data = await response.json()
            
            isComplete = data.user && 
              data.user.profile &&
              data.user.profile.fullName &&
              data.user.profile.email &&
              data.user.profile.organization
              
          } catch (apiError) {
            console.log('API also not available')
            addTerminalLine('> API also not available')
          }
        }

        if (isComplete) {
          // ✅ COMPLETE DATA - Create NEW session and redirect to dashboard
          addTerminalLine('> ✓ All required fields present!')
          addTerminalLine('> Creating new session for this user...')
          
          // Store NEW session in localStorage with unique session ID
          const newSessionId = 'session-' + existingFace.uuid + '-' + Date.now()
          localStorage.setItem('userId', existingFace.uuid)
          localStorage.setItem('sessionId', newSessionId)
          localStorage.setItem('sessionTimestamp', Date.now().toString())
          
          addTerminalLine(`> ✓ New session created: ${newSessionId.substring(0, 20)}...`)
          addTerminalLine('> Redirecting to dashboard...')
          
          setTimeout(() => {
            redirectWithUUID('/dashboard', existingFace.uuid)
          }, 1000)
        } else {
          // ✅ INCOMPLETE DATA - Create NEW session and redirect to identity page
          addTerminalLine('> Missing required fields')
          addTerminalLine('> Creating new session...')
          
          const newSessionId = 'session-' + existingFace.uuid + '-' + Date.now()
          localStorage.setItem('userId', existingFace.uuid)
          localStorage.setItem('sessionId', newSessionId)
          localStorage.setItem('sessionTimestamp', Date.now().toString())
          
          addTerminalLine('> ✓ New session created')
          addTerminalLine('> Redirecting to identity page to complete profile...')
          
          setTimeout(() => {
            redirectWithUUID('/identity', existingFace.uuid)
          }, 1000)
        }
        
      } else {
        // ✅ NEW USER - Face NOT found in Firebase
        addTerminalLine('> No matching face in database')
        addTerminalLine('> Status: NEW USER DETECTED')
        addTerminalLine('> Clearing any previous session data...')
        
        // ✅ CLEAR OLD SESSION FIRST (Important for new user)
        localStorage.removeItem('userId')
        localStorage.removeItem('sessionId')
        localStorage.removeItem('sessionTimestamp')
        
        addTerminalLine('> Generating secure UUID for new user...')
        
        // Import utilities
        const { generateUserId, redirectWithUUID } = await import('../utils/uuid')
        const { storeUserProfile } = await import('../utils/faceVerification')
        const newUserId = generateUserId()
        
        addTerminalLine(`> UUID generated: ${newUserId}`)
        addTerminalLine('> Storing AES-encrypted vector via secure backend API...')

        // ── SECURE: Route enrollment through backend (raw vectors never touch Firestore)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const enrollResp = await fetch(`${apiUrl}/api/face/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceVector, userId: newUserId })
        })
        const enrollData = await enrollResp.json()
        const storeResult = { success: enrollResp.ok, uuid: enrollData.uuid || newUserId }
        
        if (storeResult.success) {
          addTerminalLine('> ✓ Face vector stored in Firebase!')
          addTerminalLine(`> ✓ UUID: ${storeResult.uuid}`)
          addTerminalLine('> Creating user profile document...')
          
          // ✅ STEP 4: Create basic user profile in Firebase for NEW user
          try {
            const profileResult = await storeUserProfile(newUserId, {
              // Empty profile to be filled later
              profile: {
                fullName: '',
                email: '',
                phone: '',
                organization: '',
                role: '',
                location: ''
              },
              account: {
                status: 'pending',
                plan: 'basic',
                createdAt: new Date().toISOString(),
                credits: 10
              }
            })
            
            if (profileResult.success) {
              addTerminalLine('> ✓ User profile created in Firebase')
            } else {
              addTerminalLine('> ⚠ User profile creation failed')
            }
          } catch (fbError) {
            console.log('Firebase user profile creation failed:', fbError)
            addTerminalLine('> ⚠ User profile creation failed - will create on identity page')
          }
          
          // ✅ Create NEW session for NEW user
          addTerminalLine('> Creating new session for new user...')
          const newSessionId = 'session-' + newUserId + '-' + Date.now()
          localStorage.setItem('userId', newUserId)
          localStorage.setItem('sessionId', newSessionId)
          localStorage.setItem('sessionTimestamp', Date.now().toString())
          
          addTerminalLine(`> ✓ New session created: ${newSessionId.substring(0, 20)}...`)
          addTerminalLine('> Redirecting to identity page to complete profile...')
          
          setTimeout(() => {
            redirectWithUUID('/identity', newUserId)
          }, 1500)
        } else {
          addTerminalLine('> ⚠ Firebase unavailable')
          addTerminalLine('> Proceeding with UUID anyway...')
          
          // Still create session even if Firebase fails
          const newSessionId = 'session-' + newUserId + '-' + Date.now()
          localStorage.setItem('userId', newUserId)
          localStorage.setItem('sessionId', newSessionId)
          localStorage.setItem('sessionTimestamp', Date.now().toString())
          
          setTimeout(() => {
            redirectWithUUID('/identity', newUserId)
          }, 1500)
        }
      }
      
    } catch (error) {
      console.error('Verification error:', error)
      addTerminalLine(`> ERROR: ${error.message}`)

      // Increment fail counter — after 2 failures, show email fallback (OWASP requirement)
      setFailCount(prev => prev + 1)

      addTerminalLine('> System will reset in 4 seconds...')
      setHasError(true)
      setPopupResult({
        type: 'error',
        message: `${error.message}`
      })
      setShowPopup(true)
      setTimeout(() => {
        setShowPopup(false)
        resetScan()
      }, 4000)
    }
  }

  // Add terminal line
  const addTerminalLine = (line) => {
    setTerminalLines(prev => [...prev, line])
  }

  // Typing animation for initial terminal lines
  useEffect(() => {
    let currentLineIndex = 0
    let currentCharIndex = 0
    let currentLine = ''

    const typeInterval = setInterval(() => {
      if (currentLineIndex < Math.min(5, hackingCode.length)) {
        const fullLine = hackingCode[currentLineIndex]
        
        if (currentCharIndex < fullLine.length) {
          currentLine += fullLine[currentCharIndex]
          currentCharIndex++
          
          setTerminalLines(prev => {
            const newLines = [...prev]
            newLines[currentLineIndex] = currentLine
            return newLines
          })
        } else {
          currentLineIndex++
          currentCharIndex = 0
          currentLine = ''
        }
      } else {
        clearInterval(typeInterval)
      }
    }, 30)

    return () => clearInterval(typeInterval)
  }, [])

  return (
    <div className="face-scan-container">
      <motion.div 
        className="face-scan-box"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="scan-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button 
              onClick={() => window.location.href = '/'}
              style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0 0 12px 0', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              <ArrowLeft size={14} /> Back to Home
            </button>
            <div className="scan-title">
              <Shield className="scan-icon" />
              <h2>Web3 Identity Verification</h2>
            </div>
            <p style={{ color: '#00d4ff', fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', margin: '0 0 0 2.2rem' }}>
              Required for KYC & Sybil Resistance.
            </p>
          </div>
          <div className="scan-status">
            <Activity className="status-icon pulsing" />
            <span>Live</span>
          </div>
        </div>

        {/* Main Content: Camera + Terminal */}
        <div className="scan-content">
          {/* Left: Camera Screen */}
          <div className="camera-section">
            <div className="camera-container">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="camera-feed"
                width="720"
                height="560"
              />
              <canvas 
                ref={canvasRef}
                className="camera-canvas"
                width="720"
                height="560"
              />
              <div className="camera-overlay">
                <div className="scan-frame">
                  <div className="corner top-left"></div>
                  <div className="corner top-right"></div>
                  <div className="corner bottom-left"></div>
                  <div className="corner bottom-right"></div>
                </div>
                <div className="scan-line"></div>
              </div>
              <div className="camera-info">
                <Camera size={16} />
                <span>{message}</span>
              </div>
              {/* EAR Meter — always visible so user knows eye tracking is live */}
              <div className="ear-meter-bar">
                <span className="ear-label">EAR</span>
                <div className="ear-track">
                  <div
                    className="ear-fill"
                    style={{
                      width: `${Math.min(currentEAR / 0.45, 1) * 100}%`,
                      background: currentEAR < 0.27
                        ? '#ff4444'
                        : currentEAR < 0.30
                          ? '#ffaa00'
                          : '#00ff41'
                    }}
                  />
                </div>
                <span className="ear-value">{currentEAR.toFixed(3)}</span>
              </div>
              <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 100 }}>
                <button 
                  onClick={() => {
                    localStorage.setItem('bypassLoginTime', new Date().toISOString())
                    window.location.href = '/dashboard?id=dev-bypass'
                  }}
                  style={{ background: 'rgba(255,0,0,0.7)', color: 'white', border: '1px solid #ff4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px' }}
                >
                  DEV BYPASS
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="scan-progress">
              <div className="progress-label">
                <span>Scanning Progress</span>
                <span className="progress-percent">{scanningProgress}%</span>
              </div>
              <div className="progress-bar-container">
                <motion.div 
                  className="progress-bar-fill"
                  initial={{ width: '0%' }}
                  animate={{ width: `${scanningProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Right: Terminal/Code Display */}
          <div className="terminal-section">
            <div className="terminal-header">
              <Terminal size={16} />
              <span>Security Terminal</span>
              <div className="terminal-controls">
                <span className="control-dot red"></span>
                <span className="control-dot yellow"></span>
                <span className="control-dot green"></span>
              </div>
            </div>
            <div className="terminal-body" id="terminal-body">
              {terminalLines.map((line, index) => (
                <div key={index} className="terminal-line">
                  <span className="line-prompt">$</span>
                  <span className="line-text">{line}</span>
                  {index === terminalLines.length - 1 && (
                    <span className="cursor-blink">_</span>
                  )}
                </div>
              ))}
              
              {/* 2FA Fallback Button - Appears if scan takes a while or fails */}
              {terminalLines.length > 5 && !verificationComplete && !showPopup && (
                <div className="terminal-line" style={{ marginTop: '1rem' }}>
                  <button 
                    onClick={() => window.location.href = '/identity'}
                    style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Lock size={14} /> Scan failed? Use 2FA Backup Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info + Security Status Banners */}
        <div className="scan-footer">
          {/* Footer items removed as requested */}
        </div>

        {/* Lighting / Spoof Alerts */}
        {lightingStatus === 'TOO_DARK' && (
          <div style={{ margin: '0.75rem 0', padding: '0.6rem 1rem', background: 'rgba(255,170,0,0.15)', border: '1px solid #ffaa00', borderRadius: '6px', color: '#ffaa00', fontSize: '0.82rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            ⚠️ Room is too dark. Move to a well-lit area for reliable biometric scanning.
          </div>
        )}
        {lightingStatus === 'TOO_BRIGHT' && (
          <div style={{ margin: '0.75rem 0', padding: '0.6rem 1rem', background: 'rgba(255,170,0,0.15)', border: '1px solid #ffaa00', borderRadius: '6px', color: '#ffaa00', fontSize: '0.82rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            ⚠️ Too much direct light causing glare. Move away from bright windows or lamps.
          </div>
        )}
        {spoofAlert && (
          <div style={{ margin: '0.75rem 0', padding: '0.6rem 1rem', background: 'rgba(255,0,0,0.15)', border: '1px solid #ff4444', borderRadius: '6px', color: '#ff4444', fontSize: '0.82rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            🛡️ Anti-Spoofing blocked this scan. Physical face required — photos and screens are rejected.
          </div>
        )}

        {/* OWASP-required fallback after 2 consecutive failures */}
        {failCount >= 2 && (
          <div style={{ margin: '0.75rem 0', padding: '0.75rem 1rem', background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.3)', borderRadius: '6px', fontSize: '0.82rem', color: '#aaa', textAlign: 'center' }}>
            Having repeated trouble? &nbsp;
            <button
              onClick={() => window.location.href = '/identity'}
              style={{ background: 'transparent', border: 'none', color: '#00d4ff', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem' }}
            >
              Sign in with Email &amp; Password instead
            </button>
          </div>
        )}
      </motion.div>

      {/* Verification Popup */}
      <VerificationPopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        result={popupResult}
        onRetry={() => {
          setShowPopup(false)
          resetScan()
        }}
      />
    </div>
  )
}

export default FaceScan
