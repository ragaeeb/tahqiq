import AppFooter from '@/components/AppFooter';
import Transcript from '@/components/transcript';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <Transcript />
            <footer className="mt-auto">
                <AppFooter />
            </footer>
        </div>
    );
}
