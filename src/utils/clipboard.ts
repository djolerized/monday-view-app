import { FileItem } from '../types';
import { showToast } from '../components/Toast';

export async function copyFileLink(file: FileItem) {
  const url = file.publicUrl ?? file.url;
  if (!url) return;

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  showToast(file.publicUrl ? 'Link copied' : 'Link copied — expires in ~1 hour');
}
