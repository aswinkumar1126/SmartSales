"use client"

import {
    Box,
    FileUpload,
    Icon,
    useFileUploadContext,
    HStack,
    Text,
    Button,
    VStack,
    FileUploadRootProps
} from "@chakra-ui/react"
import { LuUpload, LuX, LuFile, LuImage, LuVideo, LuArchive } from "react-icons/lu"
import { ReactNode } from "react"

// Types and Interfaces
type FileAcceptType = "image" | "video" | "audio" | "pdf" | "excel" | "word" | "archive" | "all"

interface FileTypeConfig {
    accept: Record<string, string[]>
    icon: React.ElementType
    maxSize?: number
}

interface FileUploaderProps extends Omit<FileUploadRootProps, 'children' | 'onError'> {

    mode?: "single" | "multiple"
    maxFiles?: number
    maxSize?: number // in MB
    acceptTypes?: FileAcceptType | FileAcceptType[]
    showPreview?: boolean
    showDropzone?: boolean
    showTrigger?: boolean
    showList?: boolean
    clearable?: boolean
    compact?: boolean
    onFilesChange?: (files: File[]) => void
    onError?: (error: string) => void
    children?: ReactNode
    dropzoneText?: string
    buttonText?: string
    dropZoneSize?:string
}

// File type configurations
const fileTypeConfigs: Record<FileAcceptType, FileTypeConfig> = {
    image: {
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] },
        icon: LuImage,
        maxSize: 5
    },
    video: {
        accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv'] },
        icon: LuVideo,
        maxSize: 100
    },
    audio: {
        accept: { 'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'] },
        icon: LuFile,
        maxSize: 20
    },
    pdf: {
        accept: { 'application/pdf': ['.pdf'] },
        icon: LuFile,
        maxSize: 10
    },
    excel: {
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        icon: LuFile,
        maxSize: 10
    },
    word: {
        accept: {
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        icon: LuFile,
        maxSize: 10
    },
    archive: {
        accept: {
            'application/zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
            'application/x-7z-compressed': ['.7z']
        },
        icon: LuArchive,
        maxSize: 100
    },
    all: {
        accept: { '*/*': [] },
        icon: LuFile,
        maxSize: 50
    }
}

// Helper function to merge accept types
const getAcceptTypes = (types?: FileAcceptType | FileAcceptType[]): Record<string, string[]> => {
    if (!types || types.length === 0) return fileTypeConfigs.all.accept

    const typeArray = Array.isArray(types) ? types : [types]
    if (typeArray.includes('all')) return fileTypeConfigs.all.accept

    return typeArray.reduce((acc, type) => {
        const config = fileTypeConfigs[type]
        if (config) {
            Object.entries(config.accept).forEach(([mime, exts]) => {
                if (acc[mime]) {
                    acc[mime] = [...acc[mime], ...exts]
                } else {
                    acc[mime] = exts
                }
            })
        }
        return acc
    }, {} as Record<string, string[]>)
}

// Conditional Dropzone Component
interface ConditionalDropzoneProps {
    maxFiles: number
    dropzoneText?: string
    dropZoneSize?:string
}

const ConditionalDropzone = ({ maxFiles, dropzoneText, dropZoneSize }: ConditionalDropzoneProps) => {
    const fileUpload = useFileUploadContext();
    const acceptedFiles = fileUpload.acceptedFiles

    if (acceptedFiles.length >= maxFiles) {
        return null
    }

    return (
        <FileUpload.Dropzone
            p={1}  // Reduced from p={2} to p={1}
            py={2}  // Control vertical padding specifically
            borderWidth={2}
            borderRadius="md"
            minH={dropZoneSize} // Set minimum height
            maxH="400px"  // Set maximum height
            _hover={{ bg: "gray.50", borderColor: "blue.400" }}
        >
            <HStack gap={2} justify="center">  {/* Changed from VStack to HStack */}
                <Icon size="lg" color="fg.muted">  {/* Reduced from size="2xl" to "lg" */}
                    <LuUpload />
                </Icon>
                <FileUpload.DropzoneContent>
                    <Box textAlign="center">
                        <Text fontSize="sm" fontWeight="medium">  {/* Added fontSize */}
                            {dropzoneText || "Drag files here"}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">  {/* Reduced to fontSize="xs" */}
                            {maxFiles - acceptedFiles.length} more allowed
                        </Text>
                    </Box>
                </FileUpload.DropzoneContent>
            </HStack>
        </FileUpload.Dropzone>
    )
}
// File Item Component
interface FileItemProps {
    file: File
    onRemove: () => void
    showPreview?: boolean
}

const FileItem = ({ file, onRemove, showPreview = false }: FileItemProps) => {
    const fileType = file.type.split('/')[0] as FileAcceptType
    const FileIcon = fileTypeConfigs[fileType]?.icon || LuFile

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const getFilePreview = () => {
        if (file.type.startsWith('image/') && showPreview) {
            return URL.createObjectURL(file)
        }
        return null
    }

    const preview = getFilePreview()

    return (
        <FileUpload.Item
            file={file}
            p={2}
            borderWidth="1px"
            borderRadius="md"
            _hover={{ bg: "gray.50" }}
            height={"10px"}
        >
            <HStack width="full" justify="space-between">
                <HStack gap={3} flex={1} minW={0}>
                    {preview ? (
                        <Box>
                            <img
                                
                                src={preview}
                                alt={file.name}
                                loading="lazy"
                                style={{
                                   height:'40px', 
                                   width: 'auto',
                                   borderRadius: '4px',
                                   objectFit:'cover'
                                }}
                               
                                />
                        </Box>
                          
                    ) : (
                        <Box boxSize="40px" display="flex" alignItems="center" justifyContent="center">
                            <Icon size="lg" color="fg.muted">
                                <FileIcon />
                            </Icon>
                        </Box>
                    )}
                    <VStack align="start" gap={0} flex={1} minW={0}>
                        <FileUpload.ItemName
                            fontWeight="medium"
                            fontSize="sm"
                            maxW="200px"
                            truncate
                        />
                        <FileUpload.ItemSizeText fontSize="xs" color="fg.muted">
                            {formatFileSize(file.size)}
                        </FileUpload.ItemSizeText>
                    </VStack>
                </HStack>
                <FileUpload.ItemDeleteTrigger asChild onClick={onRemove}>
                    <Button size="xs" variant="ghost" colorScheme="red">
                        <LuX />
                    </Button>
                </FileUpload.ItemDeleteTrigger>
            </HStack>
        </FileUpload.Item>
    )
}

// Main FileUploader Component
const FileUploader = ({
    mode = "multiple",
    maxFiles = 3,
    maxSize,
    acceptTypes,
    showPreview = true,
    showDropzone = true,
    showTrigger = true,
    showList = true,
    clearable = true,
    compact = false,
    onFilesChange,
    onError,
    children,
    dropzoneText,
    buttonText = "Browse Files",
    dropZoneSize,
    ...props
}: FileUploaderProps) => {
   

    const accept = acceptTypes ? getAcceptTypes(acceptTypes) : fileTypeConfigs.all.accept
    const maxFileSize = maxSize ? maxSize * 1024 * 1024 : undefined

    const handleFileChange = (details: { files: File[] }) => {
        if (maxSize) {
            const oversizedFiles = details.files.filter(
                file => file.size > maxSize * 1024 * 1024
            )
            if (oversizedFiles.length > 0) {
                onError?.(`File(s) exceed maximum size of ${maxSize}MB`)
                return
            }
        }

        if (mode === "single" && details.files.length > 1) {
            onError?.("Only single file upload is allowed")
            return
        }

        onFilesChange?.(details.files)
    }

    return (
        <FileUpload.Root
            maxFiles={mode === "single" ? 1 : maxFiles}
            accept={accept}
            maxFileSize={maxFileSize}
            onFileAccept={handleFileChange}
            alignItems="stretch"
            {...props}
       
         
        >
            <FileUpload.HiddenInput />

            {showDropzone && !compact && (
                <ConditionalDropzone
                    maxFiles={mode === "single" ? 1 : maxFiles}
                    dropzoneText={dropzoneText}
                    dropZoneSize = { dropZoneSize}
                />
             
            )}

            {showTrigger && (
                <HStack gap={2} mt={compact ? 0 : 1}>
                    <FileUpload.Trigger asChild>
                        <Button size={compact ? "xs" : "sm"} colorPalette="teal">
                            <LuUpload />
                            <Text ml={2}>{buttonText}</Text>
                        </Button>
                    </FileUpload.Trigger>
                    {clearable && (
                        <FileUpload.ClearTrigger asChild>
                            <Button size={compact ? "sm" : "md"} variant="outline">
                                Clear All
                            </Button>
                        </FileUpload.ClearTrigger>
                    )}
                </HStack>
            )}

            {children}

            {showList && (
                <FileUpload.ItemGroup mt={2}>
                    <VStack gap={2}>
                        <FileUpload.Context>
                            
                            {({ acceptedFiles, deleteFile }) => (
                                <>
                                    {acceptedFiles.map((file, index) => (
                                        <FileItem
                                            key={`${file.name}-${index}`}
                                            file={file}
                                            onRemove={() => deleteFile(file)}
                                            showPreview={showPreview}
                                        />
                                    ))}
                                </>
                            )}

                        </FileUpload.Context>
                    </VStack>
                </FileUpload.ItemGroup>
            )}
        </FileUpload.Root>
    )
}


export { FileUploader }
export type { FileUploaderProps, FileAcceptType }