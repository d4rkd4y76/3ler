// Yardımcı: aktif invite ban var mı? (global veya sınıf path'i)
async function readInviteBan(studentId, classId) {
    if (typeof database === 'undefined' || !studentId) return null;
    try {
        const snapGlobal = await database.ref(`inviteBans/${studentId}`).once('value');
        let data = snapGlobal && snapGlobal.exists && snapGlobal.exists() ? (snapGlobal.val() || null) : null;
        if (!data && classId) {
            const snapClass = await database.ref(`classes/${classId}/inviteBans/${studentId}`).once('value');
            if (snapClass && snapClass.exists && snapClass.exists()) data = snapClass.val() || null;
        }
        return data;
    } catch (e) {
        console.warn('readInviteBan hata:', e);
        return null;
    }
}
