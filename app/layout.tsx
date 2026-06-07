import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Orion - API Intelligence Layer',
    description: 'Parse, explore, test, audit and generate SDKs from any API instantly',
    icons: {
        icon: '/Orion.png',
        shortcut: '/Orion.png',
        apple: '/Orion.png',
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/Orion.png" />
            </head>
            <body className={cn(inter.className, "min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground")}>
                {children}
            </body>
        </html>
    )
}
