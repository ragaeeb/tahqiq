import Transcript from '@/components/transcript';
import VersionFooter from '@/components/version-footer';

/**
 * Renders the main page layout containing the {@link Transcript} component.
 */
export default function Home() {
    return (
        <>
            <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <Transcript />
            </div>
            <VersionFooter />
        </>
    );
}
