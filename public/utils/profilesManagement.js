import { apiRequest as api } from './api-utils.js';

async function switchProfile(profileId) {
    try {
        // Call API to select profile (store the profileId in session)
        await api('/api/auth/select-profile', 'POST', { profileId: profileId });
        location.href = '/content-main';
    } catch (e) {
        return e.message;
    }
}

async function deleteProfile(userId, profile) {
    const ok = confirm(`Delete profile "${profile.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
        await api(`/api/users/${userId}/profiles/${profile.id}`, 'DELETE');
    } catch (e) {
        return e.message;
    }
}

export { switchProfile, deleteProfile };
