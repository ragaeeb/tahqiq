import Link from 'next/link';

import { Button } from '@/components/ui/button';
import VersionFooter from '@/components/version-footer';

/**
 * Renders the main page layout with navigation to Book, Manuscript, and Transcript pages.
 */
export default function Home() {
    return (
        <>
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <div className="sticky top-0 bg-white px-4 py-2 flex items-center justify-between">
                    <Link href="/book">
                        <Button>Book</Button>
                    </Link>
                    <Link href="/manuscript">
                        <Button>Manuscript</Button>
                    </Link>
                    <Link href="/transcript">
                        <Button>Transcript</Button>
                    </Link>
                </div>
            </div>
            <VersionFooter />
        </>
    );
}
