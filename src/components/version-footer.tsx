import packageJson from '../../package.json';

/**
 * Footer component that displays the current application version
 */
export default function VersionFooter() {
    return (
        <footer className="mt-auto py-4 px-8 sm:px-20 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-sm text-gray-600">
                <div>
                    <span className="font-medium">{packageJson.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span>Version</span>
                    <code className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">v{packageJson.version}</code>
                </div>
            </div>
        </footer>
    );
}
