import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Alert, Dimensions, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, { Line } from 'react-native-svg';

interface Measurements {
    [key: string]: number;
}

interface Keypoint {
    x: number;
    y: number;
    score: number;
}

const EDGES = [
    [0, 1], [0, 2], [1, 3], [2, 4],
    [0, 5], [0, 6], [5, 7], [7, 9],
    [6, 8], [8, 10], [5, 6], [5, 11],
    [6, 12], [11, 12], [11, 13], [13, 15],
    [12, 14], [14, 16]
];

export default function Fit() {
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraType, setCameraType] = useState<CameraType>('back');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [measurements, setMeasurements] = useState<Measurements | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [a4Detected, setA4Detected] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
    const [debugImage, setDebugImage] = useState<string | null>(null);
    const cameraRef = useRef<CameraView | null>(null);
    const frameCountRef = useRef<number>(0);
    const maxFrames: number = 100;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const frameWidth = 640;
    const frameHeight = 480;

    useEffect(() => {
        if (!permission?.granted && permission?.canAskAgain) {
            requestPermission();
        }

        let websocket: WebSocket | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        const wsUrl = 'ws://172.29.247.15:8000/ws';

        const connectWebSocket = () => {
            console.log(`Attempting WebSocket connection to ${wsUrl}...`);
            websocket = new WebSocket(wsUrl);

            websocket.onopen = () => {
                console.log('WebSocket connected successfully');
                retryCount = 0;
                setWs(websocket);
            };

            websocket.onmessage = (event: WebSocketMessageEvent) => {
                try {
                    const data: { measurements?: Measurements; error?: string; status?: string; disclaimer?: string; a4_detected?: boolean; keypoints?: number[][]; pixel_to_inch?: number; debug_image?: string } = JSON.parse(event.data);
                    console.log('WebSocket message received:', data);
                    if (data.disclaimer) {
                        console.log('Disclaimer received:', data.disclaimer);
                    } else if (data.a4_detected !== undefined) {
                        console.log('A4 detection status:', data.a4_detected);
                        setA4Detected(data.a4_detected);
                    } else if (data.debug_image) {
                        console.log('Debug image received, length:', data.debug_image.length);
                        setDebugImage(`data:image/jpeg;base64,${data.debug_image}`);
                    } else if (data.keypoints) {
                        console.log('Keypoints received:', data.keypoints);
                        if (!Array.isArray(data.keypoints) || data.keypoints.length !== 17) {
                            console.error('Invalid keypoints array:', data.keypoints);
                            return;
                        }
                        const transformedKeypoints: Keypoint[] = data.keypoints.map((kp, index) => {
                            if (!Array.isArray(kp) || kp.length < 3) {
                                console.warn(`Invalid keypoint at index ${index}:`, kp);
                                return { x: 0, y: 0, score: 0 };
                            }
                            return {
                                x: kp[0],
                                y: kp[1],
                                score: kp[2]
                            };
                        });
                        console.log('Transformed keypoints:', transformedKeypoints);
                        // Log skeleton bounds for debugging
                        const validKeypoints = transformedKeypoints.filter(kp => kp.score > 0.3);
                        if (validKeypoints.length > 0) {
                            const minX = Math.min(...validKeypoints.map(kp => kp.x));
                            const maxX = Math.max(...validKeypoints.map(kp => kp.x));
                            const minY = Math.min(...validKeypoints.map(kp => kp.y));
                            const maxY = Math.max(...validKeypoints.map(kp => kp.y));
                            console.log(`Skeleton bounds: x=[${minX.toFixed(1)}, ${maxX.toFixed(1)}], y=[${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
                        }
                        console.log('Screen scaling: x=', screenWidth / frameWidth, 'y=', screenHeight / frameHeight);
                        setKeypoints(transformedKeypoints);
                    } else if (data.measurements) {
                        console.log('Measurements received (raw):', JSON.stringify(data.measurements, null, 2));
                        if (data.pixel_to_inch) {
                            console.log('Pixel to inch:', data.pixel_to_inch);
                        }
                        setMeasurements(data.measurements);
                        setIsScanning(false);
                        setKeypoints([]);
                        setDebugImage(null);
                        const measurementText = Object.entries(data.measurements)
                            .map(([key, value]) => `${key}: ${value.toFixed(2)} inches`)
                            .join('\n');
                        console.log('Measurement text for alert:', measurementText);
                        Alert.alert('Scan Complete', measurementText, [
                            {
                                text: 'OK',
                                onPress: () => {
                                    setMeasurements(null);
                                    setA4Detected(false);
                                    setDebugImage(null);
                                },
                            },
                        ]);
                    } else if (data.error) {
                        console.error('Server error:', data.error);
                        Alert.alert('Error', data.error);
                        setIsScanning(false);
                        setKeypoints([]);
                        setDebugImage(null);
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                    setIsScanning(false);
                    setKeypoints([]);
                    setDebugImage(null);
                }
            };

            websocket.onerror = (event: Event) => {
                console.error('WebSocket error:', event);
                Alert.alert('Connection Error', `Failed to connect to ${wsUrl}.`);
                setIsScanning(false);
                setKeypoints([]);
                setDebugImage(null);
            };

            websocket.onclose = (event: CloseEvent) => {
                console.log('WebSocket closed:', { code: event.code, reason: event.reason });
                setWs(null);
                setIsScanning(false);
                setKeypoints([]);
                setDebugImage(null);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                    setTimeout(connectWebSocket, 2000);
                } else {
                    console.error('Max retries reached. Please check server and network.');
                    Alert.alert('Error', `Unable to connect to ${wsUrl} after ${maxRetries} attempts.`);
                }
            };
        };

        connectWebSocket();

        return () => {
            if (websocket) {
                websocket.close();
                console.log('WebSocket cleanup: closed');
            }
        };
    }, [permission, requestPermission]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        if (countdown !== null && countdown > 0) {
            console.log(`Countdown: ${countdown}s`);
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        } else if (countdown === 0) {
            console.log('Countdown finished, starting capture');
            setCountdown(null);
            startFrameCapture();
        }
        return () => {
            if (timer) {
                console.log('Clearing timer');
                clearTimeout(timer);
            }
        };
    }, [countdown]);

    const startFrameCapture = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            Alert.alert('Error', 'WebSocket not connected');
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
        setMeasurements(null);
        frameCountRef.current = 0;
        console.log('Starting frame capture...');

        const captureFrame = async () => {
            if (cameraRef.current && frameCountRef.current < maxFrames && ws?.readyState === WebSocket.OPEN) {
                try {
                    const photo = await cameraRef.current.takePictureAsync({
                        quality: 0.5,
                        base64: true,
                        skipProcessing: true,
                    });
                    let base64Data = photo.base64!;
                    if (base64Data.startsWith('data:image')) {
                        base64Data = base64Data.split(',')[1];
                    }
                    console.log(`Sending frame ${frameCountRef.current + 1}/${maxFrames}, base64 length: ${base64Data.length}`);
                    ws.send(base64Data);
                    frameCountRef.current += 1;
                    if (frameCountRef.current < maxFrames) {
                        setTimeout(captureFrame, 200);
                    } else {
                        console.log('Finished sending 100 frames');
                    }
                } catch (error: unknown) {
                    console.error('Error capturing frame:', error);
                    setIsScanning(false);
                    setKeypoints([]);
                    setDebugImage(null);
                }
            } else {
                console.log('Stopping frame capture: WebSocket closed or max frames reached');
                setKeypoints([]);
                setDebugImage(null);
            }
        };
        captureFrame();
    };

    const startScanning = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            Alert.alert('Error', 'WebSocket not connected');
            return;
        }
        if (isScanning || countdown !== null) {
            console.log('Scanning or countdown in progress');
            return;
        }
        console.log('Starting countdown');
        setCountdown(10);
    };

    if (!permission) return <View style={styles.center}><Text>Requesting permissions...</Text></View>;
    if (!permission.granted) return <View style={styles.center}><Text>Camera permission required.</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={cameraType}
                mode="picture"
                ratio="4:3"
            />
            {debugImage && (
                <Image
                    source={{ uri: debugImage }}
                    style={styles.debugImage}
                />
            )}
            {isScanning && keypoints.length === 17 && (
                <View style={styles.keypointOverlay}>
                    <Svg height={screenHeight} width={screenWidth}>
                        {EDGES.map(([p1, p2], index) => {
                            const kp1 = keypoints[p1];
                            const kp2 = keypoints[p2];
                            if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
                                const x1 = (kp1.x / frameWidth) * screenWidth;
                                const y1 = (kp1.y / frameHeight) * screenHeight;
                                const x2 = (kp2.x / frameWidth) * screenWidth;
                                const y2 = (kp2.y / frameHeight) * screenHeight;
                                console.log(`Edge ${index}: x1=${x1.toFixed(1)}, y1=${y1.toFixed(1)}, x2=${x2.toFixed(1)}, y2=${y2.toFixed(1)}`);
                                return (
                                    <Line
                                        key={index}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        stroke="yellow"
                                        strokeWidth="2"
                                    />
                                );
                            }
                            return null;
                        })}
                    </Svg>
                    {keypoints.map((kp, index) => {
                        if (kp && kp.score > 0.3) {
                            const x = (kp.x / frameWidth) * screenWidth;
                            const y = (kp.y / frameHeight) * screenHeight;
                            console.log(`Keypoint ${index}: x=${x.toFixed(1)}, y=${y.toFixed(1)}, score=${kp.score.toFixed(2)}`);
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.keypoint,
                                        { left: x - 5, top: y - 5 },
                                    ]}
                                />
                            );
                        }
                        return null;
                    })}
                </View>
            )}
            <View style={styles.statusOverlay}>
                <Text style={styles.statusText}>
                    {countdown !== null
                        ? `Preparing... ${countdown}s`
                        : a4Detected
                            ? 'A4 paper detected, improving measurement accuracy'
                            : 'For best accuracy, hold an A4 paper in front of the camera during scanning'}
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
                >
                    <MaterialIcons name="flip-camera-ios" color="#fff" size={40} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={startScanning} disabled={isScanning || countdown !== null}>
                    <Text style={styles.buttonText}>{isScanning ? 'Scanning...' : countdown !== null ? 'Preparing...' : 'Start Scan'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    camera: { flex: 1, aspectRatio: 4 / 3 },
    keypointOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
    },
    keypoint: {
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: 'red',
        borderRadius: 5,
    },
    debugImage: {
        position: 'absolute',
        top: 100,
        left: 20,
        width: 160,
        height: 120,
        borderWidth: 1,
        borderColor: 'white',
    },
    statusOverlay: {
        position: 'absolute',
        top: 20,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
    },
    button: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 12,
        borderRadius: 50,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '500',
    },

});
