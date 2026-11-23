import './globals.css';
import { Footer, Header } from '@/components/site';

export const metadata = {
  title: { template: '%s · TripleCode', default: 'TripleCode — среда разработки с AI-агентом' },
  description: 'Редактор, терминал и AI-агент для работы над кодом в одном проекте.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <a className="skip" href="#main">К содержимому</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
