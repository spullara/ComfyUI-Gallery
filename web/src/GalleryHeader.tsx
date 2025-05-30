import { useEffect, useRef, useState } from 'react';
import { Flex, AutoComplete, Button, Segmented } from 'antd';
import { CloseSquareFilled, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useGalleryContext } from './GalleryContext';
import { useDebounce, useCountDown } from 'ahooks';
import Typography from 'antd/es/typography/Typography';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { BASE_PATH } from './ComfyAppApi';

const GalleryHeader = () => {
    const {
        showSettings, setShowSettings,
        searchFileName, setSearchFileName,
        sortMethod, setSortMethod,
        imagesAutoCompleteNames,
        autoCompleteOptions, setAutoCompleteOptions,
        setOpen,
        selectedImages,
        siderCollapsed, setSiderCollapsed
    } = useGalleryContext();

    const [search, setSearch] = useState("");
    const [showClose, setShowClose] = useState(false);
    const [targetDate, setTargetDate] = useState<number>();
    const [countdown] = useCountDown({
        targetDate,
        onEnd: () => {
            setOpen(false);
            setShowClose(false);
            setTargetDate(undefined);
        },
    });
    const dragCounter = useRef(0);

    const [downloading, setDownloading] = useState(false);

    // Show close button only when dragging
    useEffect(() => {
        const onDragStart = () => setShowClose(true);
        const onDragEnd = () => {
            setShowClose(false);
            setTargetDate(undefined);
        };
        window.addEventListener('dragstart', onDragStart);
        window.addEventListener('dragend', onDragEnd);
        return () => {
            window.removeEventListener('dragstart', onDragStart);
            window.removeEventListener('dragend', onDragEnd);
        };
    }, []);

    // Debounce the search input to prevent lag
    const debouncedSearch = useDebounce(search, { wait: 100 });

    useEffect(() => {
        setSearchFileName(debouncedSearch);

        if (!debouncedSearch || debouncedSearch.length == 0) {
            setAutoCompleteOptions(imagesAutoCompleteNames);
        } else {
            setAutoCompleteOptions(
                imagesAutoCompleteNames.filter(opt =>
                    typeof opt.value === 'string' && opt.value.toLowerCase().includes(debouncedSearch.toLowerCase())
                )
            );
        }
    }, [debouncedSearch, imagesAutoCompleteNames, setAutoCompleteOptions]);

    return (
        <Flex 
            justify={"space-between"} 
            align={"center"}
            gap={20}
        >
            <div
                style={{
                    display: "flex",
                    alignContent: "center",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "20px",
                }}      
            >
                <Button
                    size="middle"
                    onClick={() => setSiderCollapsed((prev: boolean) => !prev)}
                >
                    {siderCollapsed ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                </Button>
                <Button 
                    size={"middle"} 
                    onClick={() => setShowSettings(true)}
                >
                    Settings
                </Button>
            </div>
            {selectedImages && selectedImages.length > 0 && (
                <Button
                    type="primary"
                    loading={downloading}
                    style={{ marginLeft: 8 }}
                    onClick={async () => {
                        setDownloading(true);
                        try {
                            
                        } catch (error) {
                            
                        } 
                        
                        const zip = new JSZip();
                        // Download each image as blob and add to zip
                        await Promise.all(selectedImages.map(async (url) => {
                            try {
                                // Ensure we fetch from the correct backend path
                                const fetchUrl = url.startsWith('http') ? url : `${BASE_PATH}${url}`;
                                const response = await fetch(fetchUrl);
                                const blob = await response.blob();
                                // Extract filename from url
                                const filename = url.split('/').pop() || 'image';
                                zip.file(filename, blob);
                            } catch (e) {
                                console.error('Failed to fetch image:', url, e);
                            }
                        }));
                        const content = await zip.generateAsync({ type: 'blob' });
                        FileSaver.saveAs(content, 'comfy-ui-gallery-images.zip');
                    }}
                >
                    Download Selected
                </Button>
            )}
            {showClose && (
                <div
                    style={{ 
                        display: 'inline-block' 
                    }}
                    onDragEnter={e => {
                        e.preventDefault();
                        dragCounter.current++;
                        if (!targetDate) {
                            setTargetDate(Date.now() + 3000);
                        }
                    }}
                    onDragLeave={e => {
                        e.preventDefault();
                        dragCounter.current--;
                        if (dragCounter.current === 0 && targetDate) {
                            setTargetDate(undefined);
                        }
                    }}
                >
                    <Button
                        type="default"
                        style={{ 
                            marginLeft: "8px",
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                            cursor: "pointer",
                            justifyContent: "center",
                            alignContent: "center",
                            flexWrap: "wrap",
                            width: 150
                        }}
                        tabIndex={-1} // Prevent focus flicker
                    >
                        {targetDate
                            ? (
                                <Typography 
                                    style={{ 
                                        color: '#ff4d4f', 
                                        fontWeight: 500 
                                    }}
                                >
                                    {`   Close in ${Math.ceil(countdown / 1000)}s   `}
                                </Typography>
                            ) : (
                                <Typography 
                                    style={{ 
                                        color: '#888', 
                                        fontWeight: 400 
                                    }}
                                >
                                    Hover to close 3s
                                </Typography>
                            )
                        }
                    </Button>
                </div>
            )}
            <AutoComplete
                options={
                    autoCompleteOptions && autoCompleteOptions.length > 0 
                        ? autoCompleteOptions 
                        : imagesAutoCompleteNames
                    }
                style={{ 
                    width: '50%' 
                }}
                onSearch={text => setSearch(text)}
                value={search}
                onChange={val => setSearch(val)}
                placeholder="Search for file name"
                allowClear={{ 
                    clearIcon: <CloseSquareFilled /> 
                }}
            />
            <Segmented<string>
                style={{ 
                    marginRight: 15 
                }}
                options={['Newest', 'Oldest', 'Name ↑', 'Name ↓']}
                value={sortMethod}
                onChange={value => setSortMethod(value as any)}
            />
        </Flex>
    );
};

export default GalleryHeader;
