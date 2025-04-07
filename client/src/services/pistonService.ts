// pistonService.ts
import api from './config';

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Define TypeScript interfaces for Piston API
interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

interface PistonFile {
  name: string;
  content: string;
}

interface PistonExecuteRequest {
  language: string;
  version: string;
  files: PistonFile[];
  stdin: string;
  args: string[];
}

interface PistonRunResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string | null;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: PistonRunResult;
}

// Define language map and extensions with proper types
type LanguageMap = {
  [key: string]: string;
};

/**
 * Gets all available runtimes from Piston API
 * 
 * @returns List of available runtimes
 */
export const getRuntimes = async (): Promise<PistonRuntime[]> => {
  try {
    const response = await api.get<PistonRuntime[]>(`${PISTON_API_URL}/runtimes`);
    return response.data;
  } catch (apiError) {
    console.error('Error fetching runtimes:', apiError);
    return [];
  }
};

/**
 * Get file extension for language
 * 
 * @param language - Programming language
 * @returns File extension
 */
const getFileExtension = (language: string): string => {
  const extensions: LanguageMap = {
    'python': 'py',
    'csharp': 'cs',
    'java': 'java',
    'go': 'go',
    'rust': 'rs',
    // Add more mappings as needed
  };

  return extensions[language] || language;
};

/**
 * Executes code using the Piston API
 * 
 * @param code - The code to execute
 * @param language - The programming language 
 * @param version - The language version (optional)
 * @param stdin - Standard input (optional)
 * @param args - Command line arguments (optional)
 * @returns The execution result
 */
export const executeCode = async (
  code: string,
  language: string,
  version: string | null = null,
  stdin: string = '',
  args: string[] = []
): Promise<PistonExecuteResponse> => {
  // Map frontend language values to Piston API values if needed
  const languageMap: LanguageMap = {
    'python': 'python',
    'csharp': 'csharp',
    'java': 'java',
    'go': 'go',
    'rust': 'rust',
    // Add more mappings as needed
  };

  // Get latest supported version if not specified
  let resolvedVersion = version || '';
  if (!version) {
    const runtimes = await getRuntimes();
    const runtime = runtimes.find(r =>
      r.language === languageMap[language] || r.language === language
    );
    resolvedVersion = runtime ? runtime.version : ''; // Use latest version
  }

  const payload: PistonExecuteRequest = {
    language: languageMap[language] || language,
    version: resolvedVersion,
    files: [
      {
        name: `main.${getFileExtension(language)}`,
        content: code
      }
    ],
    stdin,
    args
  };

  try {
    const response = await api.post<PistonExecuteResponse>(`${PISTON_API_URL}/execute`, payload);
    return response.data;
  } catch (apiError: unknown) {
    console.error('Error executing code:', apiError);

    // Type guard for error with response property
    if (apiError && typeof apiError === 'object' && 'response' in apiError) {
      const typedError = apiError as { response?: { data?: { message?: string } } };
      throw new Error(typedError.response?.data?.message || 'Failed to execute code');
    }

    throw new Error('Failed to execute code');
  }
};