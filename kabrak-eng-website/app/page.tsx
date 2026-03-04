'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, Lang } from './translations';
import { ArrowRight, Check, Menu, X, Globe, Mail, Phone, MapPin, ExternalLink, Sparkles, Star, TrendingUp, Shield, Users, Zap, BarChart3, Smartphone, Clock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function Section({ children, className = '', id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) {
  return (
    <motion.section id={id} className={className} style={style} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={stagger}>
      {children}
    </motion.section>
  );
}

const WA_LINK = 'https://wa.me/237653561862?text=Bonjour%20KABRAK%20ENG%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20vos%20solutions.';
const LOGO = '/KEiconelogo.jpeg';

const WA_ICON = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Home() {
  const [lang, setLang] = useState<Lang>('fr');
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const T = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      const res = await fetch('https://kabrak-exchange-pro-production.up.railway.app/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
      } else setFormStatus('error');
    } catch { setFormStatus('error'); }
  };

  const set = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));
  const NAV_LINKS: [string, string][] = [['#products', T.nav.products], ['#about', T.nav.about], ['#contact', T.nav.contact]];

  const STATS = lang === 'fr'
    ? [{ n: '50+', l: 'Clients actifs' }, { n: '99.9%', l: 'Disponibilité' }, { n: '5★', l: 'Satisfaction' }, { n: '24/7', l: 'Support' }]
    : [{ n: '50+', l: 'Active clients' }, { n: '99.9%', l: 'Uptime' }, { n: '5★', l: 'Satisfaction' }, { n: '24/7', l: 'Support' }];

  const WHY = lang === 'fr'
    ? [
        { icon: <Smartphone size={22} />, t: 'Mobile First', d: 'Application native iOS & Android, fonctionne hors-ligne' },
        { icon: <Shield size={22} />, t: 'Sécurisé', d: 'Données chiffrées, accès par rôles, sauvegardes automatiques' },
        { icon: <Zap size={22} />, t: 'Rapide à déployer', d: 'Opérationnel en moins d\'une heure, formation incluse' },
        { icon: <BarChart3 size={22} />, t: 'Rapports détaillés', d: 'Analyses en temps réel, exports PDF & Excel' },
        { icon: <Users size={22} />, t: 'Multi-utilisateurs', d: 'Gérez toute votre équipe avec des rôles distincts' },
        { icon: <Clock size={22} />, t: 'Support réactif', d: 'Assistance WhatsApp rapide, mises à jour régulières' },
      ]
    : [
        { icon: <Smartphone size={22} />, t: 'Mobile First', d: 'Native iOS & Android app, works offline' },
        { icon: <Shield size={22} />, t: 'Secure', d: 'Encrypted data, role-based access, automatic backups' },
        { icon: <Zap size={22} />, t: 'Fast to deploy', d: 'Up and running in under an hour, training included' },
        { icon: <BarChart3 size={22} />, t: 'Detailed reports', d: 'Real-time analytics, PDF & Excel exports' },
        { icon: <Users size={22} />, t: 'Multi-user', d: 'Manage your whole team with distinct roles' },
        { icon: <Clock size={22} />, t: 'Responsive support', d: 'Fast WhatsApp assistance, regular updates' },
      ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080818' }}>

      {/* ── NAVBAR ── */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <img src={LOGO} alt="KABRAK ENG" style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', border: '1.5px solid rgba(110,231,183,0.3)' }} />
            <span className="font-bold text-white text-lg tracking-tight">KABRAK <span style={{ color: '#6ee7b7' }}>ENG</span></span>
          </a>
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(110,231,183,0.1)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.25)' }}>
              <Globe size={13} />{lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-glow" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
              <WA_ICON /> {T.hero.whatsapp}
            </a>
            <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-slate-300 py-2 text-sm font-medium">{label}</a>
            ))}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
              <WA_ICON /> {T.hero.whatsapp}
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <Section className="relative overflow-hidden pt-32 pb-24 px-6">
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(6,78,59,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(6,78,59,0.4)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Sparkles size={14} style={{ color: '#34d399' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#34d399' }}>KABRAK ENG — Made in Cameroon 🇨🇲</span>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <img src={LOGO} alt="KABRAK ENG" style={{ width: 90, height: 90, borderRadius: 22, objectFit: 'cover', boxShadow: '0 0 40px rgba(52,211,153,0.25), 0 0 80px rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }} />
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black text-white mb-5 leading-tight">
            {T.hero.title}<br />
            <span className="gradient-text-green">{T.hero.subtitle}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {T.hero.description}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white btn-glow" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
              {T.hero.cta} <ArrowRight size={18} />
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1.5px solid rgba(52,211,153,0.25)' }}>
              <WA_ICON /> WhatsApp
            </a>
          </motion.div>
        </div>
      </Section>

      {/* ── STATS ── */}
      <Section className="py-12 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: '#34d399' }}>{s.n}</div>
              <div className="text-sm text-slate-400 font-medium">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ── PRODUCTS ── */}
      <Section id="products" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>{T.nav.products}</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">{T.products.title}</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">{T.products.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Exchange Pro — FEATURED */}
            <motion.div variants={fadeUp} className="card-hover relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(6,78,59,0.25), rgba(15,15,35,0.8))', border: '1.5px solid rgba(52,211,153,0.25)' }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #059669, #0d9488, #6366f1)' }} />
              <div className="p-8">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' }}>💱</div>
                    <div>
                      <h3 className="text-xl font-black text-white">{T.products.exchangePro.name}</h3>
                      <p className="text-sm font-medium" style={{ color: '#34d399' }}>{T.products.exchangePro.tagline}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>LIVE</span>
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">{T.products.exchangePro.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {T.products.exchangePro.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(52,211,153,0.15)' }}>
                        <Check size={12} style={{ color: '#34d399' }} />
                      </div>
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-3">
                  <a href="https://exchange.kabrakeng.com" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
                    {T.products.exchangePro.cta} <ExternalLink size={15} />
                  </a>
                  <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <WA_ICON />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Optic Pro */}
            <motion.div variants={fadeUp} className="card-hover relative rounded-3xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                {lang === 'fr' ? 'BIENTÔT' : 'COMING SOON'}
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.15)' }}>👓</div>
                  <div>
                    <h3 className="text-xl font-black text-white">{T.products.opticPro.name}</h3>
                    <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>{T.products.opticPro.tagline}</p>
                  </div>
                </div>
                <p className="text-slate-400 mb-6 leading-relaxed">{T.products.opticPro.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {T.products.opticPro.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(251,191,36,0.1)' }}>
                        <Check size={12} style={{ color: '#fbbf24' }} />
                      </div>
                      <span className="text-slate-400">{f}</span>
                    </li>
                  ))}
                </ul>
                <button disabled className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold opacity-60 cursor-not-allowed" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  {T.products.opticPro.cta}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── WHY KABRAK ── */}
      <Section className="py-24 px-6" style={{ background: 'rgba(6,78,59,0.06)', borderTop: '1px solid rgba(52,211,153,0.08)', borderBottom: '1px solid rgba(52,211,153,0.08)' }}>
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{lang === 'fr' ? 'Pourquoi choisir KABRAK ENG ?' : 'Why choose KABRAK ENG?'}</h2>
            <p className="text-slate-400 text-lg">{lang === 'fr' ? 'Des solutions pensées pour l\'Afrique, avec des standards mondiaux' : 'Solutions designed for Africa, with world-class standards'}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {WHY.map((w, i) => (
              <motion.div key={i} variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>{w.icon}</div>
                <h3 className="text-base font-bold text-white mb-2">{w.t}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{w.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <Section id="about" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>{T.nav.about}</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">{T.about.title}</h2>
            <p className="text-lg font-semibold" style={{ color: '#34d399' }}>{T.about.subtitle}</p>
          </motion.div>

          <motion.div variants={fadeUp} className="p-8 rounded-3xl mb-12 text-center" style={{ background: 'rgba(6,78,59,0.2)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <p className="text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">{T.about.description}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {T.about.values.map((v, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-7 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-5xl mb-4">{v.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA BANNER ── */}
      <Section className="py-16 px-6">
        <motion.div variants={fadeUp} className="max-w-4xl mx-auto text-center p-12 rounded-3xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.6), rgba(13,148,136,0.3))', border: '1.5px solid rgba(52,211,153,0.3)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative">
            {lang === 'fr' ? 'Prêt à digitaliser votre bureau ?' : 'Ready to digitize your bureau?'}
          </h2>
          <p className="text-slate-300 mb-8 text-lg relative">
            {lang === 'fr' ? 'Essai gratuit 14 jours • Aucune carte bancaire requise • Support inclus' : 'Free 14-day trial • No credit card required • Support included'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white btn-glow" style={{ background: '#25D366' }}>
              <WA_ICON /> {lang === 'fr' ? 'Démarrer maintenant' : 'Start now'}
            </a>
            <a href="https://exchange.kabrakeng.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
              {lang === 'fr' ? 'Voir la démo' : 'View demo'} <ExternalLink size={16} />
            </a>
          </div>
        </motion.div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact" className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>{T.nav.contact}</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">{T.contact.title}</h2>
            <p className="text-lg text-slate-400">{T.contact.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div variants={fadeUp} className="space-y-5">
              {[
                { icon: <Phone size={18} />, val: T.contact.info.phone, href: `tel:${T.contact.info.phone}` },
                { icon: <Mail size={18} />, val: T.contact.info.email, href: `mailto:${T.contact.info.email}` },
                { icon: <MapPin size={18} />, val: T.contact.info.location, href: undefined },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>{item.icon}</div>
                  {item.href ? <a href={item.href} className="text-white font-medium hover:text-emerald-400 transition-colors">{item.val}</a> : <span className="text-white font-medium">{item.val}</span>}
                </div>
              ))}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-base font-bold text-white w-full" style={{ background: 'linear-gradient(135deg, #128C7E, #25D366)' }}>
                <WA_ICON /> WhatsApp — {lang === 'fr' ? 'Réponse en moins d\'1h' : 'Response within 1h'}
              </a>
              {/* Logo in contact */}
              <div className="flex items-center gap-4 p-5 rounded-2xl" style={{ background: 'rgba(6,78,59,0.2)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <img src={LOGO} alt="KABRAK ENG" style={{ width: 52, height: 52, borderRadius: 13, objectFit: 'cover' }} />
                <div>
                  <div className="font-black text-white">KABRAK ENG</div>
                  <div className="text-sm text-slate-400">{lang === 'fr' ? 'Solutions logicielles pour entreprises africaines' : 'Software solutions for African businesses'}</div>
                </div>
              </div>
            </motion.div>

            <motion.form variants={fadeUp} onSubmit={handleSubmit} className="p-7 rounded-3xl space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
              <input type="text" placeholder={T.contact.form.name} value={formData.name} onChange={e => set('name', e.target.value)} required className="w-full px-4 py-3.5 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <input type="email" placeholder={T.contact.form.email} value={formData.email} onChange={e => set('email', e.target.value)} required className="w-full px-4 py-3.5 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <input type="tel" placeholder={T.contact.form.phone} value={formData.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-3.5 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <input type="text" placeholder={T.contact.form.company} value={formData.company} onChange={e => set('company', e.target.value)} className="w-full px-4 py-3.5 rounded-xl text-white text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <textarea placeholder={T.contact.form.message} value={formData.message} onChange={e => set('message', e.target.value)} required rows={4} className="w-full px-4 py-3.5 rounded-xl text-white text-sm resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none' }} />
              <button type="submit" disabled={formStatus === 'loading'} className="w-full px-6 py-4 rounded-xl text-base font-bold text-white transition-opacity" style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', opacity: formStatus === 'loading' ? 0.7 : 1 }}>
                {formStatus === 'loading' ? T.contact.form.sending : T.contact.form.submit}
              </button>
              {formStatus === 'success' && <p className="text-sm text-center font-medium" style={{ color: '#34d399' }}>{T.contact.form.success}</p>}
              {formStatus === 'error' && <p className="text-sm text-center font-medium" style={{ color: '#f87171' }}>{T.contact.form.error}</p>}
            </motion.form>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6" style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={LOGO} alt="KABRAK ENG" style={{ width: 42, height: 42, borderRadius: 11, objectFit: 'cover', border: '1.5px solid rgba(52,211,153,0.25)' }} />
                <span className="font-black text-white text-xl">KABRAK <span style={{ color: '#6ee7b7' }}>ENG</span></span>
              </div>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-4">{T.footer.tagline}</p>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366' }}>
                <WA_ICON /> +237 653 561 862
              </a>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{T.footer.products}</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="https://exchange.kabrakeng.com" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">💱 KABRAK Exchange Pro</a></li>
                <li><span className="opacity-40 flex items-center gap-1.5">👓 KABRAK Optic Pro</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">{T.footer.company}</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#about" className="hover:text-emerald-400 transition-colors">{T.nav.about}</a></li>
                <li><a href="#contact" className="hover:text-emerald-400 transition-colors">{T.nav.contact}</a></li>
                <li><a href="mailto:kabrakeng@gmail.com" className="hover:text-emerald-400 transition-colors">kabrakeng@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-sm text-slate-600">© {new Date().getFullYear()} KABRAK ENG. {T.footer.rights}</span>
            <span className="text-sm text-slate-600">🇨🇲 Made with ❤️ in Cameroon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
