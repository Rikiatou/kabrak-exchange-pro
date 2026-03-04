import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useOnboardingStore from '../store/onboardingStore';
import useLanguageStore from '../store/languageStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GREEN = '#0B6E4F';
const GOLD = '#e8a020';

/**
 * TooltipGuide — shows contextual tooltip steps on first visit to a screen.
 *
 * Usage:
 *   <TooltipGuide screenKey="dashboard" steps={[
 *     { text: 'Ceci est votre tableau de bord', position: 'center' },
 *     { text: 'Appuyez ici pour créer', position: 'bottom', icon: 'add-circle' },
 *   ]} />
 *
 * Props:
 *   screenKey: string — unique key per screen (stored in AsyncStorage)
 *   steps: array of { text, textEn?, icon?, position?: 'top'|'center'|'bottom' }
 */
export default function TooltipGuide({ screenKey, steps = [] }) {
  const { isTooltipSeen, markTooltipSeen } = useOnboardingStore();
  const { language } = useLanguageStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!screenKey || steps.length === 0) return;
    if (isTooltipSeen(screenKey)) return;
    // Small delay so the screen renders first
    const timer = setTimeout(() => {
      setVisible(true);
      animateIn();
    }, 600);
    return () => clearTimeout(timer);
  }, [screenKey]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.85);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (cb) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => cb && cb());
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      animateOut(() => {
        setCurrentStep(currentStep + 1);
        animateIn();
      });
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    animateOut(() => {
      setVisible(false);
      markTooltipSeen(screenKey);
    });
  };

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const text = (language === 'en' && step.textEn) ? step.textEn : step.text;
  const pos = step.position || 'center';

  const justifyContent = pos === 'top' ? 'flex-start' : pos === 'bottom' ? 'flex-end' : 'center';
  const paddingTop = pos === 'top' ? 120 : 0;
  const paddingBottom = pos === 'bottom' ? 140 : 0;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableOpacity
        style={[styles.overlay, { justifyContent, paddingTop, paddingBottom }]}
        activeOpacity={1}
        onPress={handleNext}
      >
        <Animated.View style={[styles.tooltipCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Step counter */}
          <View style={styles.stepRow}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>{currentStep + 1}/{steps.length}</Text>
            </View>
            <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Icon */}
          {step.icon && (
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon} size={32} color={GOLD} />
            </View>
          )}

          {/* Text */}
          <Text style={styles.tooltipText}>{text}</Text>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            {!isLast && (
              <TouchableOpacity onPress={handleDismiss}>
                <Text style={styles.skipText}>{language === 'fr' ? 'Passer' : 'Skip'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {isLast
                  ? (language === 'fr' ? 'Compris !' : 'Got it!')
                  : (language === 'fr' ? 'Suivant' : 'Next')
                }
              </Text>
              {!isLast && <Ionicons name="arrow-forward" size={14} color="#fff" style={{ marginLeft: 4 }} />}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    backgroundColor: '#1a2332',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    backgroundColor: 'rgba(11,110,79,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  stepText: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  iconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(232,160,32,0.12)',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
