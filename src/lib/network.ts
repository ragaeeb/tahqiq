import { uploadFile } from '@huggingface/hub';

/**
 * Options for uploading to HuggingFace
 */
interface HuggingFaceUploadOptions {
    /** The data to upload */
    fileBlob: Blob;
    /** Repository ID (e.g., "username/repo-name") */
    repoId: string;
    /** Path/filename in the repository (e.g., "data/file.json") */
    pathInRepo: string;
    /** HuggingFace API token */
    token: string;
    /** Repository type (defaults to "dataset") */
    repoType?: 'dataset' | 'model' | 'space';
}

/**
 * Uploads a file to HuggingFace Hub using the official @huggingface/hub library
 *
 * @param options - Upload configuration options
 * @returns Promise resolving to the file URL on HuggingFace
 * @throws {Error} When upload fails
 *
 * @example
 * ```typescript
 * const url = await uploadToHuggingFace({
 *     filePath: './data.json.zip',
 *     repoId: 'username/my-dataset',
 *     pathInRepo: '123.json.zip',
 *     token: process.env.HF_TOKEN!,
 * });
 * console.log(`Uploaded to: ${url}`);
 * ```
 */
export const uploadToHuggingFace = async ({
    fileBlob,
    repoId,
    pathInRepo,
    token,
    repoType = 'dataset',
}: HuggingFaceUploadOptions): Promise<string> => {
    const repoTypePath = repoType === 'dataset' ? 'datasets' : repoType === 'model' ? 'models' : 'spaces';

    console.info(`Uploading to HuggingFace...`);
    console.info(`Repository: ${repoId}`);
    console.info(`Path: ${pathInRepo}`);

    await uploadFile({
        commitTitle: `Upload ${pathInRepo}`,
        credentials: { accessToken: token },
        file: { content: fileBlob, path: pathInRepo },
        hubUrl: 'https://huggingface.co',
        repo: { name: repoId, type: repoType },
    });

    const fileUrl = `https://huggingface.co/${repoTypePath}/${repoId}/resolve/main/${pathInRepo}`;
    console.info(`Upload complete: ${fileUrl}`);

    return fileUrl;
};
