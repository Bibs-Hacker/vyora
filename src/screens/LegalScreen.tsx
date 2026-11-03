import { Back } from '../components/Icons'

const CONTENT: Record<string, { title: string; body: string[] }> = {
  terms: { title: 'Terms of Service', body: [
    'Welcome to VYORA. By creating an account you agree to use the service respectfully and lawfully.',
    'You are responsible for the content you post and for keeping your login credentials secure.',
    'You must be old enough to use a social network in your region. You may not impersonate others or post content you do not have the right to share.',
    'We may suspend or remove accounts that violate these terms or our Community Guidelines.',
    'The service is provided as-is. These terms are a plain-language summary and have not been reviewed for compliance with any specific jurisdiction.'
  ] },
  privacy: { title: 'Privacy Policy', body: [
    'We store the data you provide: your profile, posts, media, comments, messages, and preferences.',
    'Your email is used for authentication and account recovery. Private messages are visible only to conversation participants.',
    'Media you upload is stored in our backend storage. Public posts are visible according to your account privacy settings.',
    'You can edit or delete your content, and you can permanently delete your account from Settings.',
    'We do not sell your personal data. This summary describes current behavior and is not a legal guarantee of compliance with any specific regulation.'
  ] },
  guidelines: { title: 'Community Guidelines', body: [
    'Be kind. Treat others with respect and assume good intent.',
    'No harassment, hate speech, threats, or targeted abuse.',
    'No spam, scams, or impersonation.',
    'No illegal content, non-consensual imagery, or content that endangers others.',
    'Report content that breaks these rules. Repeated or serious violations lead to removal.'
  ] },
  safety: { title: 'Reporting & Safety', body: [
    'You can report any post, comment, profile, or message using the options menu.',
    'You can block any account; blocked users cannot message you or see your content, and they are removed from your followers.',
    'Set your account to private to approve followers individually.',
    'If you believe you are in immediate danger, contact your local emergency services.',
    'Reports are stored securely and reviewed against our Community Guidelines.'
  ] }
}

export function LegalScreen({ page, onBack }: { page: string; onBack: () => void }) {
  const c = CONTENT[page] ?? CONTENT.terms
  return (
    <div className='view' style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className='row' style={{ marginBottom: 16 }}>
        <button className='icon-btn' onClick={onBack}><Back /></button>
        <h2 className='section-title' style={{ margin: 0 }}>{c.title}</h2>
      </div>
      <div className='card'>
        {c.body.map((p, i) => <p key={i} style={{ lineHeight: 1.6, marginTop: i ? 14 : 0 }}>{p}</p>)}
      </div>
      <p className='muted' style={{ textAlign: 'center', fontSize: 12 }}>VYORA — A world made for connection</p>
    </div>
  )
}
