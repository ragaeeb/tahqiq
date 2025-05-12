import AppFooter from '@/components/AppFooter';
import TranscriptManager from '@/components/transcript-manager';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <TranscriptManager />
            <footer className="mt-auto">
                <AppFooter />
            </footer>
        </div>
    );
}
