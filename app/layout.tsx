import './globals.css';import type {Metadata} from 'next';
export const metadata:Metadata={title:'Kynthera — Recovery intelligence for AI agents',description:'The adaptive failure intelligence graph. Investigate, recover, and learn.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
