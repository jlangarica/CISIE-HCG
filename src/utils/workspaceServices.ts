/**
 * Google Workspace integration services using native fetch calls with the OAuth accessToken.
 */

// Custom types for response handling
export interface WorkspaceSuccessResult {
  spreadsheetUrl: string;
  driveFolderUrl: string;
  pdfFileId?: string;
  solicitudFileId?: string;
  emailSent: boolean;
}

/**
 * Searches the spreadsheet for folder properties and sheets to locate the correct tab title for a given GID.
 */
export async function getTabTitleByGid(
  accessToken: string,
  spreadsheetId: string,
  gid: string
): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch spreadsheet metadata to resolve GID, using default tab.');
      return '';
    }

    const data = await response.json();
    if (data && Array.isArray(data.sheets)) {
      const targetGid = parseInt(gid, 10);
      const matchedSheet = data.sheets.find(
        (sheet: any) => sheet.properties?.sheetId === targetGid
      );
      if (matchedSheet) {
        return matchedSheet.properties.title;
      }
    }
  } catch (err) {
    console.error('Error resolving GID tab name:', err);
  }
  return '';
}

/**
 * Appends a row containing the submission details to the user's specific spreadsheet and GID.
 */
export async function appendToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  gid: string,
  formData: any,
  folio: string
): Promise<boolean> {
  // Try to resolve sheet title for the GID first to prevent hardcoded defaults failing
  let tabTitle = await getTabTitleByGid(accessToken, spreadsheetId, gid);
  if (!tabTitle) {
    tabTitle = 'Respuestas de formulario 1'; // Standard fall back
  }

  // Define range as the Sheet tab title plus starting column
  const range = `${tabTitle}!A:N`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`;

  const currentDate = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const rowValues = [
    [
      folio,
      currentDate,
      formData.solicitante.nombre || '',
      formData.solicitante.cargo || '',
      formData.solicitante.servicio || '',
      formData.solicitante.unidadHospitalaria || '',
      formData.articulo.descripcion || '',
      formData.articulo.familia || '',
      formData.articulo.unidadMedida === 'Otro (Especificar)'
        ? formData.articulo.unidadMedidaOtro || ''
        : formData.articulo.unidadMedida || '',
      formData.articulo.partida || '',
      formData.complementaria.costoReferencia || '',
      formData.complementaria.proveedor || '',
      formData.complementaria.justificacion || '',
      formData.complementaria.pdfNombre || 'Sin adjunto',
    ],
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: rowValues,
      }),
    });

    if (!response.ok) {
      const errDetails = await response.text();
      console.error('Failed to append to spreadsheet:', errDetails);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error writing to Google Sheets:', err);
    return false;
  }
}

/**
 * Creates a file metadata in Google Drive and uploads its contents via standard PATCH
 */
export async function uploadToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  mimeType: string,
  fileBody: Blob | File | string
): Promise<string | null> {
  try {
    // 1. Create file metadata with target parents folder
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const metadataResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: fileName,
        parents: [folderId],
        mimeType: mimeType,
      }),
    });

    if (!metadataResponse.ok) {
      const errTxt = await metadataResponse.text();
      console.error('Failed to create file metadata in Drive:', errTxt);
      return null;
    }

    const fileMeta = await metadataResponse.json();
    const fileId = fileMeta.id;

    if (!fileId) return null;

    // 2. Perform raw media content upload using PATCH
    const mediaUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const mediaResponse = await fetch(mediaUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: fileBody,
    });

    if (!mediaResponse.ok) {
      const errTxt = await mediaResponse.text();
      console.error('Failed to upload file content media block:', errTxt);
      return null;
    }

    return fileId;
  } catch (err) {
    console.error('Network error during Google Drive upload:', err);
    return null;
  }
}

/**
 * Sends a notification email utilizing the Gmail base64 raw API
 */
export async function sendGmailNotification(
  accessToken: string,
  toEmail: string,
  folio: string,
  formData: any
): Promise<boolean> {
  const subject = `Nueva Solicitud de Inclusión al Catálogo: ${folio}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
      <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin: 0; font-size: 20px; text-transform: uppercase;">Hospital Civil de Guadalajara</h2>
        <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; text-transform: uppercase; font-weight: bold;">Notificación Automática de Catalogación</p>
      </div>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 15px; margin-bottom: 20px; text-align: center;">
        <span style="font-size: 11px; color: #1e3a8a; display: block; font-weight: bold; margin-bottom: 4px;">FOLIO ASIGNADO SOBERANO</span>
        <strong style="font-size: 18px; color: #dc2626; font-family: monospace;">${folio}</strong>
      </div>

      <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e3a8a; font-size: 14px;">1. Detalles del Solicitante</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 40%;">Nombre Empleado:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formData.solicitante.nombre}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Cargo:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formData.solicitante.cargo}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Servicio Clínico:</td>
          <td style="padding: 4px 0; color: #334155;">${formData.solicitante.servicio}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Hospital Adscrito:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formData.solicitante.unidadHospitalaria}</td>
        </tr>
      </table>

      <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e3a8a; font-size: 14px;">2. Especificaciones Técnicas</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 15px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 40%;">Descripción:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${formData.articulo.descripcion}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Familia Insumos:</td>
          <td style="padding: 4px 0; color: #1e293b;">${formData.articulo.familia}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Unidad de Medida:</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e293b;">${
            formData.articulo.unidadMedida === 'Otro (Especificar)'
              ? formData.articulo.unidadMedidaOtro
              : formData.articulo.unidadMedida
          }</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Costo Ref. (MXN):</td>
          <td style="padding: 4px 0; font-weight: bold; color: #1e3a8a;">$${formData.complementaria.costoReferencia}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;">Proveedor Propuesto:</td>
          <td style="padding: 4px 0; color: #1e293b;">${formData.complementaria.proveedor}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; margin-bottom: 20px;">
        <strong style="color: #475569; display: block; margin-bottom: 4px;">Justificación Médica / Técnica:</strong>
        <p style="color: #334155; margin: 0; font-style: italic; font-family: Georgia, serif;">"${formData.complementaria.justificacion}"</p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #94a3b8;">
        Este documento ha sido autenticado por el Sistema de Inclusión HCG en Cloud Run y respaldado en Google Drive.
      </div>
    </div>
  `;

  // Standard raw base64 MIME formatting to preserve encoding compatibility
  const emailContent = [
    'From: me',
    `To: ${toEmail}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ].join('\r\n');

  // Base64URL-safe encoding
  const base64Encoded = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Encoded,
      }),
    });

    return response.ok;
  } catch (err) {
    console.error('Network error sending Gmail notification:', err);
    return false;
  }
}
