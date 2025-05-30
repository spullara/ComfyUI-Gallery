import { createRoot } from 'react-dom/client'
import Gallery from './Gallery.tsx'
import App from 'antd/es/app/App';
import { DEFAULT_SETTINGS, STORAGE_KEY, type SettingsState } from './GalleryContext.tsx';
import { ComfyAppApi } from './ComfyAppApi.ts';
import { ConfigProvider, theme } from 'antd';
import { useLocalStorageState } from 'ahooks';

ComfyAppApi.registerExtension({
    name: "Gallery",
    init() {
        
        let settings = DEFAULT_SETTINGS;
        try {
            const raw = localStorage.getItem('comfy-ui-gallery-settings');
            if (raw) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        } catch {}

        const targetElement = document.querySelector(settings.buttonBoxQuery) || document.querySelector(DEFAULT_SETTINGS.buttonBoxQuery);
        if (!targetElement) throw new Error('Could not find element for Button Box Query');

        const box = document.createElement("div");
        targetElement.appendChild(box);

        createRoot(box).render(
            <Main />,
        );

        ComfyAppApi.startMonitoring(settings.relativePath);
    }
});

function Main() {
    const [settingsState, setSettings] = useLocalStorageState<SettingsState>(STORAGE_KEY, {
        defaultValue: DEFAULT_SETTINGS,
        listenStorageChange: true,
    });

    return (<>
        <ConfigProvider
            theme={{
                algorithm: settingsState.darkMode ? theme.darkAlgorithm : undefined,
            }}
        >
            <App>
                <Gallery />
            </App>
        </ConfigProvider>
    </>);
}