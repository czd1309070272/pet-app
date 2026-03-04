import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  History,
  RefreshCw,
  CheckCircle2,
  Languages,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetProfile, HealthScanResult, ScannerResult, TranslatorResult } from '../types';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';
import { ViewHeader, ActionButton, ErrorModal } from '../components/shared/CommonUI';
import { HealthReportResult } from '../components/HealthReportResult';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';
import { detectReportStyles } from '../styles/detectReportStyles';
import { pickFromCamera, pickFromAlbum } from '../utils/imagePicker';
import { ensureImageUri } from '../utils/imageUri';

export type DetectTab = 'HEALTH' | 'SCANNER' | 'TRANSLATOR';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Detect'>;

type HealthMode = 'STOOL' | 'SKIN';

function calculateAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

/** 拟态玻璃卡片 - 与主页一致 */
function GlassCard({
  children,
  style,
  intensity = 64,
  dark,
}: {
  children: React.ReactNode;
  style?: object;
  intensity?: number;
  dark: boolean;
}) {
  const shadow = dark ? shadowGlass.dark : shadowGlass.light;
  const tintColor = dark ? colors.glassCard.tintDark : colors.glassCard.tintLight;
  const borderColor = dark ? colors.glassCard.borderDark : colors.glassCard.borderLight;
  return (
    <View style={[glassStyles.shadowWrap, shadow, style, { overflow: 'visible' }]}>
      <View style={glassStyles.outer}>
        <BlurView
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[glassStyles.tintOverlay, { backgroundColor: tintColor }]} />
        <View style={[glassStyles.borderWrap, { borderColor }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const glassStyles = StyleSheet.create({
  shadowWrap: { borderRadius: borderRadius['3xl'] },
  outer: { flex: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
  tintOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: borderRadius['3xl'] },
  borderWrap: { flex: 1, borderWidth: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
});

/** Loading 圖標緩慢旋轉動畫（表示處理中） */
function SpinningIcon({ children }: { children: React.ReactNode }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinValue]);
  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

const TAB_CONFIG: { key: DetectTab; label: string; short: string }[] = [
  { key: 'HEALTH', label: '健康檢測', short: '健康' },
  { key: 'SCANNER', label: '成分分析', short: '成分' },
  { key: 'TRANSLATOR', label: '報告翻譯', short: '翻譯' },
];

function getHeaderTitle(tab: DetectTab): string {
  switch (tab) {
    case 'HEALTH': return 'AI 健康檢測';
    case 'SCANNER': return '成分分析管家';
    case 'TRANSLATOR': return '診療報告翻譯官';
  }
}

export default function DetectScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params?: { initialTab?: DetectTab } };
}) {
  const initialTab = route.params?.initialTab ?? 'HEALTH';
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<DetectTab>(initialTab);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPetName, setSelectedPetName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [showPetPicker, setShowPetPicker] = useState(false);

  // Health
  const [healthMode, setHealthMode] = useState<HealthMode>('STOOL');
  const [isScanning, setIsScanning] = useState(false);
  const [healthImageUri, setHealthImageUri] = useState<string | null>(null);
  const [healthResult, setHealthResult] = useState<HealthScanResult | null>(null);

  // Scanner
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannerImageUri, setScannerImageUri] = useState<string | null>(null);
  const [scannerResult, setScannerResult] = useState<ScannerResult | null>(null);
  const [scannerError, setScannerError] = useState<{ code: number; message: string } | null>(null);

  // Translator
  const [translatorStep, setTranslatorStep] = useState(1);
  const [translatorImageUri, setTranslatorImageUri] = useState<string | null>(null);
  const [translatorResult, setTranslatorResult] = useState<TranslatorResult | null>(null);
  const [translatorError, setTranslatorError] = useState<{ code: number; message: string } | null>(null);

  useEffect(() => {
    frontApi.fetchPets().then((list) => {
      setPets(list);
      const active = list.filter((p) => !p.isMemorial);
      if (active.length > 0) {
        if (!selectedPetName) setSelectedPetName(active[0].name);
        if (!selectedPetId) setSelectedPetId(active[0].id);
      }
    });
  }, []);

  const activePets = pets.filter((p) => !p.isMemorial);
  const currentPet = activePets.find((p) => p.name === selectedPetName) ?? activePets[0];
  const scannerPet = activePets.find((p) => p.id === selectedPetId);

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';

  const goHistory = () => {
    navigation.navigate('HistoryReport', { type: tab });
  };

  const runHealth = (imageUri: string | null) => {
    setIsScanning(true);
    setHealthImageUri(imageUri);
    setHealthResult(null);
    mockApi.performAIHealthScan(healthMode, selectedPetName || currentPet?.name || '', imageUri).then((res) => {
      setHealthResult(res);
      setIsScanning(false);
    });
  };

  const runScanner = (imageUri: string | null) => {
    if (!imageUri) return;
    setIsAnalyzing(true);
    setScannerImageUri(imageUri);
    setScannerResult(null);
    setScannerError(null);
    const defaultPet = activePets[0];
    const petContext = defaultPet
      ? { breed: defaultPet.breed ?? '', age: calculateAge(defaultPet.birthday), gender: defaultPet.gender ?? '' }
      : { breed: '', age: 0, gender: '' };
    frontApi.performScannerAnalysis({ uri: imageUri }, petContext)
      .then((res) => {
        if (res.code === 200 && res.data) setScannerResult(res.data);
        else setScannerError({ code: res.code ?? 500, message: res.message ?? '分析失敗' });
      })
      .catch(() => setScannerError({ code: 500, message: '分析超時，請重試' }))
      .finally(() => setIsAnalyzing(false));
  };

  const runTranslator = (imageUri: string | null) => {
    if (!imageUri) return;
    setTranslatorStep(2);
    setTranslatorImageUri(imageUri);
    setTranslatorResult(null);
    setTranslatorError(null);
    frontApi.performTranslatorAnalysis(selectedPetName || currentPet?.name || '', { uri: imageUri })
      .then((res) => {
        if (res.code === 200 && res.data) setTranslatorResult(res.data);
        else setTranslatorError({ code: res.code ?? 500, message: res.message ?? '翻譯失敗' });
      })
      .catch(() => setTranslatorError({ code: 500, message: '翻譯助手暫時走神了' }))
      .finally(() => { /* step stays 2 */ });
  };

  const handleCamera = async () => {
    const result = await pickFromCamera();
    if (!result) return;
    if (tab === 'HEALTH') runHealth(result.uri);
    else if (tab === 'SCANNER') runScanner(result.uri);
    else runTranslator(result.uri);
  };

  const handleAlbum = async () => {
    const result = await pickFromAlbum();
    if (!result) return;
    if (tab === 'HEALTH') runHealth(result.uri);
    else if (tab === 'SCANNER') runScanner(result.uri);
    else runTranslator(result.uri);
  };

  const switchTab = (t: DetectTab) => {
    setTab(t);
    setShowPetPicker(false);
    setHealthResult(null);
    setHealthImageUri(null);
    setScannerResult(null);
    setScannerImageUri(null);
    setScannerError(null);
    setTranslatorResult(null);
    setTranslatorError(null);
    setTranslatorImageUri(null);
    setTranslatorStep(1);
  };

  return (
    <View style={[detectReportStyles.container, { backgroundColor: dark ? colors.slate[950] : '#fff9f5', paddingTop: insets.top - spacing.xl }]}>
      <ViewHeader
        title={getHeaderTitle(tab)}
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable onPress={goHistory} style={[detectReportStyles.historyBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            <History size={20} color={tab === 'HEALTH' ? '#3b82f6' : tab === 'SCANNER' ? colors.orange[500] : '#10b981'} />
          </Pressable>
        }
      />

      <ScrollView style={detectReportStyles.scroll} contentContainerStyle={detectReportStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 检测项目切换 - 拟态玻璃 */}
        <GlassCard dark={dark} style={detectReportStyles.tabCard} intensity={72}>
          <View style={detectReportStyles.tabRow}>
            {TAB_CONFIG.map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => switchTab(key)}
                style={[detectReportStyles.tabItem, tab === key && (dark ? detectReportStyles.tabItemActiveDark : detectReportStyles.tabItemActive)]}
              >
                <Text style={[detectReportStyles.tabText, { color: tab === key ? (key === 'HEALTH' ? '#3b82f6' : key === 'SCANNER' ? colors.orange[500] : '#10b981') : subColor }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <ErrorModal isOpen={!!scannerError} onClose={() => setScannerError(null)} code={scannerError?.code} onRetry={() => runScanner(null)} />
        <ErrorModal isOpen={!!translatorError} onClose={() => { setTranslatorError(null); setTranslatorStep(1); }} code={translatorError?.code} onRetry={() => runTranslator(null)} />

        {/* ---------- HEALTH ---------- */}
        {tab === 'HEALTH' && (
          <>
            {!healthResult && !isScanning && (
              <>
                <Text style={[detectReportStyles.label, { color: subColor }]}>選擇受檢寵物</Text>
                <Pressable onPress={() => setShowPetPicker(!showPetPicker)} style={[detectReportStyles.petPicker, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                  {currentPet && (
                    <>
                      <Image source={{ uri: ensureImageUri(currentPet?.avatar) }} style={detectReportStyles.petAvatar} />
                      <View style={detectReportStyles.petPickerBody}>
                        <Text style={[detectReportStyles.petName, { color: textColor }]}>{currentPet.name}</Text>
                        <View style={detectReportStyles.petMeta}>
                          <View style={detectReportStyles.breedTag}><Text style={detectReportStyles.breedTagText}>{currentPet.breed}</Text></View>
                          <Text style={[detectReportStyles.petGender, { color: subColor }]}>{currentPet.gender}</Text>
                        </View>
                      </View>
                      <ChevronDown size={20} color={showPetPicker ? '#3b82f6' : subColor} />
                    </>
                  )}
                </Pressable>
                {showPetPicker && (
                  <View style={[detectReportStyles.petDropdown, { backgroundColor: dark ? colors.slate[900] : '#fff', borderColor: glassBorder }]}>
                    {activePets.map((pet) => (
                      <Pressable key={pet.id} onPress={() => { setSelectedPetName(pet.name); setShowPetPicker(false); }} style={[detectReportStyles.petOption, selectedPetName === pet.name && detectReportStyles.petOptionActive]}>
                        <Image source={{ uri: ensureImageUri(pet.avatar) }} style={detectReportStyles.petOptionAvatar} />
                        <Text style={[detectReportStyles.petOptionName, { color: textColor }]}>{pet.name}</Text>
                        <Text style={[detectReportStyles.petOptionBreed, { color: subColor }]}>{pet.breed}</Text>
                        {selectedPetName === pet.name && <CheckCircle2 size={14} color="#3b82f6" />}
                      </Pressable>
                    ))}
                  </View>
                )}
                <Text style={[detectReportStyles.label, { color: subColor }]}>檢測模式</Text>
                <View style={[detectReportStyles.modeTabs, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                  <Pressable onPress={() => setHealthMode('STOOL')} style={[detectReportStyles.modeTab, healthMode === 'STOOL' && (dark ? detectReportStyles.modeTabActiveDark : detectReportStyles.modeTabActive)]}>
                    <Text style={[detectReportStyles.modeTabText, { color: healthMode === 'STOOL' ? '#3b82f6' : subColor }]}>糞便檢測</Text>
                  </Pressable>
                  <Pressable onPress={() => setHealthMode('SKIN')} style={[detectReportStyles.modeTab, healthMode === 'SKIN' && (dark ? detectReportStyles.modeTabActiveDark : detectReportStyles.modeTabActive)]}>
                    <Text style={[detectReportStyles.modeTabText, { color: healthMode === 'SKIN' ? '#3b82f6' : subColor }]}>皮膚掃描</Text>
                  </Pressable>
                </View>
                <View style={detectReportStyles.uploadZoneTextOnly}>
                  <Text style={[detectReportStyles.uploadTitle, { color: textColor }]} numberOfLines={3}>準備好進行{healthMode === 'STOOL' ? '糞便' : '皮膚'}拍攝了嗎？</Text>
                  <Text style={[detectReportStyles.uploadSub, { color: subColor }]}>請確保環境光線充足</Text>
                </View>
                <View style={detectReportStyles.actionRow}>
                  <Pressable onPress={handleCamera} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <View style={detectReportStyles.actionIconWrap}><Camera size={24} color="#fff" /></View>
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>拍照檢測</Text>
                  </Pressable>
                  <Pressable onPress={handleAlbum} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <View style={[detectReportStyles.actionIconWrap, { backgroundColor: dark ? colors.slate[800] : '#fff', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }]}><ImageIcon size={24} color="#3b82f6" /></View>
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>相簿選擇</Text>
                  </Pressable>
                </View>
              </>
            )}
            {isScanning && (
              <View style={detectReportStyles.scanningWrap}>
                <View style={detectReportStyles.scanningIconWrap}>
                  <SpinningIcon><RefreshCw size={40} color="#3b82f6" /></SpinningIcon>
                </View>
                <Text style={[detectReportStyles.scanningTitle, { color: textColor }]}>AI 正在深度掃描...</Text>
                <Text style={[detectReportStyles.scanningSub, { color: subColor }]}>正在比對 {selectedPetName || currentPet?.name} 的健康特徵庫</Text>
              </View>
            )}
            {healthResult && !isScanning && (
              <HealthReportResult
                petName={selectedPetName || currentPet?.name || '—'}
                subtitle="檢測完成 · 剛剛"
                status={healthResult.status}
                resultImageUrl={healthImageUri || healthResult.resultUrl}
                reportNo={healthResult.reportNo}
                detectType={healthMode}
                visualSummary={healthResult.visualSummary || healthResult.desc}
                diagnosis={healthResult.diagnosis}
                suggestions={healthResult.suggestions}
                dark={dark}
                avatarUri={currentPet?.avatar}
                actions={
                  <>
                    <ActionButton onPress={() => { setHealthResult(null); setHealthImageUri(null); }} variant="glass" style={detectReportStyles.resultActionBtn}>
                      <RefreshCw size={18} color={dark ? '#f8fafc' : colors.gray[600]} />
                      <Text style={[detectReportStyles.resultActionText, { color: textColor }]}>重新檢測</Text>
                    </ActionButton>
                    <Pressable style={[detectReportStyles.resultActionBtn, detectReportStyles.resultActionPrimary]}>
                      <Text style={detectReportStyles.resultActionPrimaryText}>存入健康檔案</Text>
                    </Pressable>
                  </>
                }
              />
            )}
          </>
        )}

        {/* ---------- SCANNER（不需選擇寵物）---------- */}
        {tab === 'SCANNER' && (
          <>
            {!scannerResult && !isAnalyzing && (
              <>
                <View style={detectReportStyles.uploadZoneTextOnly}>
                  <Text style={[detectReportStyles.uploadTitle, { color: textColor }]} numberOfLines={2}>請拍攝食品配料表照片</Text>
                  <Text style={[detectReportStyles.uploadSub, { color: subColor }]}>AI 將識別成分並評估風險</Text>
                </View>
                <View style={detectReportStyles.actionRow}>
                  <Pressable onPress={handleCamera} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <View style={detectReportStyles.actionIconWrap}><Camera size={24} color="#fff" /></View>
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>相機拍攝</Text>
                  </Pressable>
                  <Pressable onPress={handleAlbum} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <View style={[detectReportStyles.actionIconWrap, { backgroundColor: '#3b82f6' }]}><ImageIcon size={24} color="#fff" /></View>
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>相簿上傳</Text>
                  </Pressable>
                </View>
              </>
            )}
            {isAnalyzing && (
              <View style={detectReportStyles.scanningWrap}>
                <SpinningIcon><Loader2 size={64} color={colors.orange[500]} /></SpinningIcon>
                <Text style={[detectReportStyles.scanningTitle, { color: textColor }]}>正在分析成分...</Text>
                <Text style={[detectReportStyles.scanningSub, { color: subColor }]}>識別配料與風險評估中</Text>
              </View>
            )}
            {scannerResult && !isAnalyzing && (
              <>
                <View style={detectReportStyles.reportImageContainer}>
                  <View style={detectReportStyles.reportImageWrap}>
                    <Image source={{ uri: ensureImageUri(scannerImageUri || scannerResult.resultUrl) }} style={detectReportStyles.reportImage} resizeMode="cover" />
                    <View style={detectReportStyles.reportImageOverlay}>
                      <Text style={detectReportStyles.reportImageLabel}>上傳的配料表圖片</Text>
                    </View>
                  </View>
                </View>

                <View style={detectReportStyles.scannerDetail}>
                  {/* 1. AI 結論 */}
                  <GlassCard dark={dark} style={detectReportStyles.aiConclusionWrap} intensity={64}>
                    <View style={[detectReportStyles.aiConclusionBlock, { backgroundColor: dark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)', borderColor: dark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)' }]}>
                      <View style={detectReportStyles.aiConclusionHeader}>
                        <View style={[detectReportStyles.aiConclusionIconWrap, { backgroundColor: '#3b82f6' }]}>
                          <Sparkles size={18} color="#fff" />
                        </View>
                        <Text style={[detectReportStyles.aiConclusionLabel, { color: textColor }]}>AI 結論</Text>
                      </View>
                      <Text style={[detectReportStyles.aiConclusionText, { color: textColor }]}>{scannerResult.summary}</Text>
                    </View>
                  </GlassCard>

                  {/* 2. 有風險的成分 */}
                  <View style={detectReportStyles.scannerSection}>
                    <View style={[detectReportStyles.scannerSectionHeader, detectReportStyles.riskSectionHeader]}>
                      <XCircle size={20} color="#b91c1c" />
                      <Text style={[detectReportStyles.scannerSectionTitle, detectReportStyles.riskSectionTitle]}>有風險的成分</Text>
                      <View style={[detectReportStyles.scannerSectionBadge, detectReportStyles.riskSectionBadge]}>
                        <Text style={detectReportStyles.scannerSectionBadgeText}>{scannerResult.riskIngredients.length} 項</Text>
                      </View>
                    </View>
                    <View style={[detectReportStyles.scannerSectionBody, dark ? detectReportStyles.riskSectionBodyDark : detectReportStyles.riskSectionBody]}>
                      {scannerResult.riskIngredients.length > 0 ? (
                        scannerResult.riskIngredients.map((item, i) => (
                          <View key={i} style={[detectReportStyles.riskItemRow, dark ? detectReportStyles.riskItemRowBgDark : detectReportStyles.riskItemRowBg]}>
                            <View style={detectReportStyles.riskItemBullet} />
                            <Text style={[detectReportStyles.riskItemText, dark && detectReportStyles.riskItemTextDark]}>{item}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={detectReportStyles.riskEmptyWrap}>
                          <Text style={detectReportStyles.riskEmptyText}>暫未發現風險成分 ✨</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 3. 無風險的成分 */}
                  <View style={detectReportStyles.scannerSection}>
                    <View style={[detectReportStyles.scannerSectionHeader, detectReportStyles.safeSectionHeader]}>
                      <CheckCircle size={20} color="#047857" />
                      <Text style={[detectReportStyles.scannerSectionTitle, detectReportStyles.safeSectionTitle]}>無風險的成分</Text>
                      <View style={[detectReportStyles.scannerSectionBadge, detectReportStyles.safeSectionBadge]}>
                        <Text style={detectReportStyles.scannerSectionBadgeText}>{scannerResult.safeIngredients.length} 項</Text>
                      </View>
                    </View>
                    <View style={[detectReportStyles.scannerSectionBody, dark ? detectReportStyles.safeSectionBodyDark : detectReportStyles.safeSectionBody]}>
                      {scannerResult.safeIngredients.map((item, i) => (
                        <View key={i} style={[detectReportStyles.safeItemRow, dark ? detectReportStyles.safeItemRowBgDark : detectReportStyles.safeItemRowBg]}>
                          <View style={detectReportStyles.safeItemBullet} />
                          <Text style={[detectReportStyles.safeItemText, dark && detectReportStyles.safeItemTextDark]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={detectReportStyles.resultActionsRow}>
                  <ActionButton onPress={() => { setScannerResult(null); setScannerImageUri(null); }} variant="glass" style={detectReportStyles.resultActionBtn}>
                    <RefreshCw size={18} color={dark ? '#f8fafc' : colors.gray[600]} />
                    <Text style={[detectReportStyles.resultActionText, { color: textColor }]}>重新掃描</Text>
                  </ActionButton>
                  <Pressable style={[detectReportStyles.resultActionBtn, detectReportStyles.resultActionPrimary]}>
                    <Text style={detectReportStyles.resultActionPrimaryText}>存入檔案</Text>
                  </Pressable>
                </View>
              </>
            )}
          </>
        )}

        {/* ---------- TRANSLATOR（受檢寵物 UI 與健康檢測統一）---------- */}
        {tab === 'TRANSLATOR' && (
          <>
            {translatorStep === 1 && (
              <>
                <Text style={[detectReportStyles.label, { color: subColor }]}>選擇受檢寵物</Text>
                <Pressable onPress={() => setShowPetPicker(!showPetPicker)} style={[detectReportStyles.petPicker, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                  {currentPet && (
                    <>
                      <Image source={{ uri: ensureImageUri(currentPet?.avatar) }} style={detectReportStyles.petAvatar} />
                      <View style={detectReportStyles.petPickerBody}>
                        <Text style={[detectReportStyles.petName, { color: textColor }]}>{currentPet.name}</Text>
                        <View style={detectReportStyles.petMeta}>
                          <View style={detectReportStyles.breedTag}><Text style={detectReportStyles.breedTagText}>{currentPet.breed}</Text></View>
                          <Text style={[detectReportStyles.petGender, { color: subColor }]}>{currentPet.gender}</Text>
                        </View>
                      </View>
                      <ChevronDown size={20} color={showPetPicker ? '#3b82f6' : subColor} />
                    </>
                  )}
                </Pressable>
                {showPetPicker && (
                  <View style={[detectReportStyles.petDropdown, { backgroundColor: dark ? colors.slate[900] : '#fff', borderColor: glassBorder }]}>
                    {activePets.map((pet) => (
                      <Pressable key={pet.id} onPress={() => { setSelectedPetName(pet.name); setShowPetPicker(false); }} style={[detectReportStyles.petOption, selectedPetName === pet.name && detectReportStyles.petOptionActive]}>
                        <Image source={{ uri: ensureImageUri(pet.avatar) }} style={detectReportStyles.petOptionAvatar} />
                        <Text style={[detectReportStyles.petOptionName, { color: textColor }]}>{pet.name}</Text>
                        <Text style={[detectReportStyles.petOptionBreed, { color: subColor }]}>{pet.breed}</Text>
                        {selectedPetName === pet.name && <CheckCircle2 size={14} color="#3b82f6" />}
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={detectReportStyles.uploadZoneTextOnly}>
                  <Text style={[detectReportStyles.uploadTitle, { color: textColor }]} numberOfLines={3}>準備好 {selectedPetName || currentPet?.name} 的化驗單了嗎？</Text>
                  <Text style={[detectReportStyles.uploadSub, { color: subColor }]}>拍照或上傳圖片即可解讀</Text>
                </View>
                <View style={detectReportStyles.actionRow}>
                  <Pressable onPress={handleCamera} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <Camera size={24} color="#10b981" />
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>拍照識別</Text>
                  </Pressable>
                  <Pressable onPress={handleAlbum} style={[detectReportStyles.actionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                    <ImageIcon size={24} color="#10b981" />
                    <Text style={[detectReportStyles.actionCardText, { color: textColor }]}>選擇圖片</Text>
                  </Pressable>
                </View>
              </>
            )}
            {translatorStep === 2 && (
              <>
                {!translatorResult && !translatorError && (
                  <View style={detectReportStyles.scanningWrap}>
                    <SpinningIcon><RefreshCw size={48} color="#10b981" /></SpinningIcon>
                    <Text style={[detectReportStyles.analyzingText, { color: subColor }]}>AI 正在深度解讀 {selectedPetName || currentPet?.name} 的報告...</Text>
                  </View>
                )}
                {translatorResult && (() => {
                  const fragments: string[] = translatorResult.originalFragments?.length
                    ? translatorResult.originalFragments
                    : (translatorResult.termExcerpts ? [translatorResult.termExcerpts] : []);
                  const blocks = translatorResult.translateBlocks?.length
                    ? translatorResult.translateBlocks
                    : (translatorResult.explanation != null
                      ? [{ explanation: translatorResult.explanation, suggestions: translatorResult.suggestions ?? [] }]
                      : []);
                  const fragmentBorder = dark ? 'rgba(16,185,129,0.25)' : 'rgba(5,150,105,0.2)';
                  const fragmentBg = dark ? 'rgba(16,185,129,0.08)' : 'rgba(209,250,229,0.5)';
                  const explainBorder = dark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.15)';
                  const explainBg = dark ? 'rgba(16,185,129,0.06)' : 'rgba(236,253,245,0.6)';
                  return (
                    <>
                      <View style={detectReportStyles.resultHead}>
                        <Image source={{ uri: ensureImageUri(currentPet?.avatar) }} style={detectReportStyles.resultPetAvatar} />
                        <View style={detectReportStyles.resultHeadBody}>
                          <Text style={[detectReportStyles.resultHeadTitle, { color: textColor }]}>{selectedPetName || currentPet?.name} 的診療報告</Text>
                          <Text style={[detectReportStyles.resultHeadMeta, { color: subColor }]}>AI 分析完畢</Text>
                        </View>
                      </View>

                      {translatorImageUri ? (
                        <View style={detectReportStyles.reportImageContainer}>
                          <View style={detectReportStyles.reportImageWrap}>
                            <Image source={{ uri: ensureImageUri(translatorImageUri) }} style={detectReportStyles.reportImage} resizeMode="cover" />
                            <View style={detectReportStyles.reportImageOverlay}>
                              <Text style={detectReportStyles.reportImageLabel}>上傳的報告圖片</Text>
                            </View>
                          </View>
                        </View>
                      ) : null}

                      {fragments.length > 0 && (
                        <>
                          <Text style={[detectReportStyles.translatorSectionTitle, { color: '#047857' }]}>原文片段</Text>
                          <View style={detectReportStyles.translatorFragmentsWrap}>
                            {fragments.map((text, i) => (
                              <View key={i} style={[detectReportStyles.translatorFragmentCard, { backgroundColor: fragmentBg, borderColor: fragmentBorder }]}>
                                <Text style={[detectReportStyles.translatorFragmentText, { color: textColor }]}>{text}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      {blocks.length > 0 && (
                        <>
                          <View style={detectReportStyles.explainHead}>
                            <Languages size={20} color="#059669" />
                            <Text style={[detectReportStyles.explainTitle, { color: textColor }]}>大白話翻譯解釋 + 建議</Text>
                          </View>
                          <View style={detectReportStyles.translatorExplainBlocksWrap}>
                            {blocks.map((block, i) => (
                              <View key={i} style={[detectReportStyles.translatorExplainBlockCard, { backgroundColor: explainBg, borderColor: explainBorder }]}>
                                <Text style={[detectReportStyles.translatorExplainBlockLabel, { color: '#047857' }]}>解釋</Text>
                                <Text style={[detectReportStyles.translatorExplainBlockText, { color: textColor }]}>{block.explanation}</Text>
                                {block.suggestions.length > 0 && (
                                  <>
                                    <Text style={[detectReportStyles.translatorExplainBlockLabel, { color: '#047857' }]}>建議</Text>
                                    <View style={detectReportStyles.translatorSuggestionsList}>
                                      {block.suggestions.map((s, j) => (
                                        <Text key={j} style={[detectReportStyles.translatorSuggestionItem, { color: textColor }]}>· {s}</Text>
                                      ))}
                                    </View>
                                  </>
                                )}
                              </View>
                            ))}
                          </View>
                        </>
                      )}

                      <View style={detectReportStyles.resultActionsRow}>
                        <ActionButton
                          onPress={() => { setTranslatorStep(1); setTranslatorImageUri(null); setTranslatorResult(null); setTranslatorError(null); }}
                          variant="glass"
                          style={detectReportStyles.resultActionBtn}
                        >
                          <RefreshCw size={18} color={dark ? '#f8fafc' : colors.gray[600]} />
                          <Text style={[detectReportStyles.resultActionText, { color: textColor }]}>重新檢測</Text>
                        </ActionButton>
                        <Pressable style={[detectReportStyles.resultActionBtn, detectReportStyles.resultActionPrimary]}>
                          <Text style={detectReportStyles.resultActionPrimaryText}>存入檔案</Text>
                        </Pressable>
                      </View>
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
