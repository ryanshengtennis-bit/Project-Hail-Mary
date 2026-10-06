import '../styles.css';
import './mobile.css';
import './solar-system.css';
import './space-music.css';
import SpaceMusic from './SpaceMusic';

export const metadata = {
  title: 'Ryan | Curious by Nature',
  description: "Ryan's personal website — biology, books, games, music, coding, tennis, and fencing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<SpaceMusic /></body>
    </html>
  );
}
