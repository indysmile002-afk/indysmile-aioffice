/**
 * DriveService.gs
 * Wraps DriveApp around the "AI OFFICE" folder structure that Setup.gs
 * creates (01_SYSTEM ... 08_REPORTS). Images/videos/documents live here;
 * the FILES sheet only stores metadata + drive_file_id pointing back to them.
 */

function getSystemSubfolder_(name) {
  var id = getProperty('FOLDER_' + name, '');
  if (!id) throw new Error('Unknown system folder "' + name + '" — run Setup.gs > runSetup() first.');
  return DriveApp.getFolderById(id);
}

/** Gets (or lazily creates) the per-project folder under 02_PROJECTS. */
function getOrCreateProjectFolder(projectId, projectName) {
  var parent = getSystemSubfolder_('02_PROJECTS');
  var folderName = projectId + ' - ' + projectName;
  var existing = parent.getFoldersByName(folderName);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(folderName);
}

/** Saves a base64 payload (e.g. an AI-generated image) into a project's Drive folder and returns its metadata. */
function saveBase64File(projectId, projectName, base64Data, fileName, mimeType) {
  var folder = getOrCreateProjectFolder(projectId, projectName);
  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var file = folder.createFile(blob);
  appendRow('FILES', {
    file_id: generateId('FIL'),
    project_id: projectId,
    step_id: '',
    file_name: file.getName(),
    file_type: mimeType,
    drive_file_id: file.getId(),
    version: 1,
    status: 'ACTIVE',
    created_at: nowIso(),
  });
  return { id: file.getId(), url: file.getUrl(), name: file.getName() };
}

function listProjectFiles(projectId, projectName) {
  var folder = getOrCreateProjectFolder(projectId, projectName);
  var it = folder.getFiles();
  var out = [];
  while (it.hasNext()) {
    var f = it.next();
    out.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), size: f.getSize(), mimeType: f.getMimeType() });
  }
  return out;
}
