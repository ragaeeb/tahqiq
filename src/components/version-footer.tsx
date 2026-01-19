import packageJson from '../../package.json';

/**
 * Footer component that displays the current application version
 */
export default function VersionFooter() {
    return (
        <footer className="mt-auto border-gray-200 border-t bg-gray-50 px-8 py-4 sm:px-20">
            <div className="flex items-center justify-between text-gray-600 text-sm">
                <div>
                    <span className="font-medium">{packageJson.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span>Version</span>
                    <code className="rounded bg-gray-200 px-2 py-1 font-mono text-xs">v{packageJson.version}</code>
                </div>
            </div>
        </footer>
    );
}
