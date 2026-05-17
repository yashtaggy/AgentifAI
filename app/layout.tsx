import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Agentic API Copilot',
    description: 'AI-powered assistance for your OpenAPI endpoints',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground")}>
                {children}
            </body>
        </html>
    )
}
