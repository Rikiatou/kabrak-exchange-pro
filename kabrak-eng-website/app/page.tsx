'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { t, Lang } from './translations';
import { ArrowRight, Check, Menu, X, Globe, Building2, Mail, Phone, MapPin, ExternalLink, Sparkles, Shield, Users } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Section({ children, className = '', id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) {
  return (
    <motion.section id={id} className={className} style={style} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={stagger}>
      {children}
    </motion.section>
  );
}

const WA_LINK = 'https://wa.me/237653561862?text=Bonjour%20KABRAK%20ENG%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20vos%20solutions.';

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
      } else {
        setFormStatus('error');
      }
    } catch {
      setFormStatus('error');
    }
  };

  const set = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));

  const NAV_LINKS: [string, string][] = [
    ['#products', T.nav.products],
    ['#about', T.nav.about],
    ['#contact', T.nav.contact],
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f23' }}>

      {/* ── NAVBAR ── */}
      <nav className="nav-blur fixed top-0 left-0 right-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/KEiconelogo.jpeg" alt="KABRAK ENG Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <span className="font-bold text-white text-lg">KABRAK <span style={{ color: '#6ee7b7' }}>ENG</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-slate-300 hover:text-white transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Globe size={14} />{lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
              {T.hero.whatsapp} <ArrowRight size={14} />
            </a>
            <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 flex flex-col gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-slate-300 py-2 text-sm">{label}</a>
            ))}
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
              {T.hero.whatsapp}
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <Section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Sparkles size={16} style={{ color: '#818cf8' }} />
            <span className="text-sm font-semibold" style={{ color: '#818cf8' }}>Innovation & Excellence</span>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold text-white mb-4">
            {T.hero.title}<br />
            <span className="gradient-text">{T.hero.subtitle}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            {T.hero.description}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#products" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white" style={{ background: '#6366f1' }}>
              {T.hero.cta} <ArrowRight size={18} />
            </a>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
              {T.hero.whatsapp}
            </a>
          </motion.div>
        </div>
      </Section>

      {/* ── PRODUCTS ── */}
      <Section id="products" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">{T.products.title}</h2>
            <p className="text-lg text-slate-300">{T.products.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Exchange Pro */}
            <motion.div variants={fadeUp} className="card-hover p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(99,102,241,0.2)' }}>
                  💱
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{T.products.exchangePro.name}</h3>
                  <p className="text-sm" style={{ color: '#818cf8' }}>{T.products.exchangePro.tagline}</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">{T.products.exchangePro.description}</p>
              <ul className="space-y-3 mb-6">
                {T.products.exchangePro.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#6366f1' }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="https://exchange.kabrakeng.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#6366f1' }}>
                {T.products.exchangePro.cta} <ExternalLink size={16} />
              </a>
            </motion.div>

            {/* Optic Pro */}
            <motion.div variants={fadeUp} className="card-hover p-8 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {T.products.opticPro.comingSoon && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(236,72,153,0.2)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)' }}>
                  BIENTÔT
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(236,72,153,0.2)' }}>
                  👓
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{T.products.opticPro.name}</h3>
                  <p className="text-sm" style={{ color: '#ec4899' }}>{T.products.opticPro.tagline}</p>
                </div>
              </div>
              <p className="text-slate-300 mb-6">{T.products.opticPro.description}</p>
              <ul className="space-y-3 mb-6">
                {T.products.opticPro.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#ec4899' }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button disabled className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed" style={{ background: 'rgba(236,72,153,0.3)', color: '#ec4899' }}>
                {T.products.opticPro.cta}
              </button>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <Section id="about" className="py-20 px-6" style={{ background: 'rgba(99,102,241,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">{T.about.title}</h2>
            <p className="text-lg" style={{ color: '#818cf8' }}>{T.about.subtitle}</p>
          </motion.div>
          <motion.p variants={fadeUp} className="text-lg text-slate-300 text-center mb-16 max-w-3xl mx-auto">
            {T.about.description}
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8">
            {T.about.values.map((v, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-4xl mb-4">{v.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{v.title}</h3>
                <p className="text-slate-300">{v.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CONTACT ── */}
      <Section id="contact" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">{T.contact.title}</h2>
            <p className="text-lg text-slate-300">{T.contact.subtitle}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Phone size={20} style={{ color: '#6366f1' }} />
                  <span className="text-white font-semibold">{T.contact.info.phone}</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <Mail size={20} style={{ color: '#6366f1' }} />
                  <span className="text-white font-semibold">{T.contact.info.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={20} style={{ color: '#6366f1' }} />
                  <span className="text-white font-semibold">{T.contact.info.location}</span>
                </div>
              </div>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold text-white w-full" style={{ background: '#25D366' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </motion.div>

            {/* Contact Form */}
            <motion.form variants={fadeUp} onSubmit={handleSubmit} className="p-6 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input type="text" placeholder={T.contact.form.name} value={formData.name} onChange={e => set('name', e.target.value)} required className="w-full px-4 py-3 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input type="email" placeholder={T.contact.form.email} value={formData.email} onChange={e => set('email', e.target.value)} required className="w-full px-4 py-3 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input type="tel" placeholder={T.contact.form.phone} value={formData.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-3 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input type="text" placeholder={T.contact.form.company} value={formData.company} onChange={e => set('company', e.target.value)} className="w-full px-4 py-3 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <textarea placeholder={T.contact.form.message} value={formData.message} onChange={e => set('message', e.target.value)} required rows={4} className="w-full px-4 py-3 rounded-lg text-white resize-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button type="submit" disabled={formStatus === 'loading'} className="w-full px-6 py-3 rounded-lg text-base font-semibold text-white" style={{ background: '#6366f1' }}>
                {formStatus === 'loading' ? T.contact.form.sending : T.contact.form.submit}
              </button>
              {formStatus === 'success' && <p className="text-sm text-center" style={{ color: '#6366f1' }}>{T.contact.form.success}</p>}
              {formStatus === 'error' && <p className="text-sm text-center" style={{ color: '#ec4899' }}>{T.contact.form.error}</p>}
            </motion.form>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6" style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/KEiconelogo.jpeg" alt="KABRAK ENG Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                <span className="font-bold text-white text-lg">KABRAK <span style={{ color: '#6ee7b7' }}>ENG</span></span>
              </div>
              <p className="text-sm text-slate-400 max-w-sm">{T.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{T.footer.products}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://exchange.kabrakeng.com" className="hover:text-white transition-colors">KABRAK Exchange Pro</a></li>
                <li><span className="opacity-50">KABRAK Optic Pro</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">{T.footer.company}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#about" className="hover:text-white transition-colors">{T.nav.about}</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">{T.nav.contact}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} KABRAK ENG. {T.footer.rights}
          </div>
        </div>
      </footer>
    </div>
  );
}
