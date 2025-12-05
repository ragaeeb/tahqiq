import { BookOpenIcon, FileTextIcon, LayoutListIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';

import VersionFooter from '@/components/version-footer';

type NavigationCard = { description: string; href: string; icon: React.ReactNode; title: string };

const navigationCards: NavigationCard[] = [
    {
        description: 'Browse and explore Islamic texts organized by books and chapters',
        href: '/book',
        icon: <BookOpenIcon className="h-8 w-8" />,
        title: 'Book Browser',
    },
    {
        description: 'View and manage text excerpts from Islamic scholarly works',
        href: '/excerpts',
        icon: <LayoutListIcon className="h-8 w-8" />,
        title: 'Excerpts Editor',
    },
    {
        description: 'Work with manuscript pages and manage transcriptions',
        href: '/manuscript',
        icon: <FileTextIcon className="h-8 w-8" />,
        title: 'Manuscript',
    },
    {
        description: 'Configure application preferences and customize your experience',
        href: '/settings',
        icon: <SettingsIcon className="h-8 w-8" />,
        title: 'Settings',
    },
];

/**
 * Landing page with navigation to main application sections
 */
export default function Home() {
    return (
        <>
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Animated background elements */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="-left-1/4 -top-1/4 absolute h-96 w-96 animate-blob rounded-full bg-purple-300 opacity-20 mix-blend-multiply blur-3xl filter" />
                    <div className="animation-delay-2000 -right-1/4 -top-1/4 absolute h-96 w-96 animate-blob rounded-full bg-blue-300 opacity-20 mix-blend-multiply blur-3xl filter" />
                    <div className="animation-delay-4000 -bottom-1/4 absolute left-1/4 h-96 w-96 animate-blob rounded-full bg-indigo-300 opacity-20 mix-blend-multiply blur-3xl filter" />
                </div>

                {/* Main content */}
                <div className="relative z-10 w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 font-bold text-5xl text-gray-900 tracking-tight sm:text-6xl">Tahqiq</h1>
                        <p className="mx-auto max-w-2xl text-gray-600 text-xl">
                            Digital tools for Islamic scholarly research and manuscript analysis
                        </p>
                    </div>

                    {/* Navigation Cards Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
                        {navigationCards.map((card) => (
                            <Link
                                className="group hover:-translate-y-1 relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-900/5 transition-all duration-300 hover:shadow-2xl"
                                href={card.href}
                                key={card.href}
                            >
                                {/* Card gradient overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 group-hover:from-blue-500/5 group-hover:to-purple-500/5 group-hover:opacity-100" />

                                <div className="relative">
                                    {/* Icon */}
                                    <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                                        {card.icon}
                                    </div>

                                    {/* Title */}
                                    <h2 className="mb-2 font-semibold text-2xl text-gray-900 transition-colors duration-300 group-hover:text-blue-600">
                                        {card.title}
                                    </h2>

                                    {/* Description */}
                                    <p className="text-gray-600 leading-relaxed">{card.description}</p>

                                    {/* Arrow indicator */}
                                    <div className="mt-4 flex items-center font-medium text-blue-600 text-sm">
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            Open →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Additional Navigation */}
                    <div className="mt-12 text-center">
                        <Link
                            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-gray-700 text-sm shadow-md ring-1 ring-gray-900/5 transition-all duration-300 hover:bg-gray-50 hover:shadow-lg"
                            href="/ajza"
                        >
                            <LayoutListIcon className="h-4 w-4" />
                            Browse Ajza
                        </Link>
                    </div>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
