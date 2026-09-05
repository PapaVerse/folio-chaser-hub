import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BookOpen, FileText, Calendar, User, Download, FileSpreadsheet, Presentation, Search, Edit3, X, Upload, CheckCircle2 } from 'lucide-react';

export default function KnowledgeGuidelineEmployee({ currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit / Replace File State
  const [editingDoc, setEditingDoc] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [guidelinesRes, usersRes] = await Promise.all([
      supabase.from('knowledge_guidelines').select('*').order('created_at', { ascending: false }),
      supabase.from('app_users').select('department')
    ]);

    if (!guidelinesRes.error) {
      setDocuments(guidelinesRes.data || []);
    }

    if (!usersRes.error && usersRes.data) {
      const dbDepts = usersRes.data
        .map(u => u.department)
        .filter(dept => dept && dept.trim() !== '');
      
      const uniqueDepts = Array.from(new Set(dbDepts));
      const finalDepts = uniqueDepts.length > 0 ? uniqueDepts : ['Operations', 'Admin'];
      
      setDepartmentsList(finalDepts);
      
      const empDept = currentUser?.department;
      if (empDept && finalDepts.includes(empDept)) {
        setActiveTab(empDept);
      } else {
        setActiveTab(finalDepts[0]);
      }
    }
    setLoading(false);
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FileText size={20} color="#2563eb" />;
    const ext = fileName.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet size={20} color="#16a34a" />;
    if (['ppt', 'pptx'].includes(ext)) return <Presentation size={20} color="#ea580c" />;
    if (['pdf'].includes(ext)) return <FileText size={20} color="#dc2626" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={20} color="#2563eb" />;
    return <FileText size={20} color="#2563eb" />;
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: '2px', fontWeight: '700' }}>
          {part}
        </span>
      ) : part
    );
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setEditTitle(doc.title || '');
    setSelectedFile(null);
    setFileError('');
    setSuccessMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setFileError('Invalid file format. Please upload PDF, DOC/DOCX, PPT/PPTX, or XLS/XLSX files.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    setSelectedFile(file);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setUpdating(true);

    try {
      let fileUrl = editingDoc.file_url;
      let fileName = editingDoc.file_name;

      if (selectedFile) {
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const uniqueFileName = `${Date.now()}_${cleanName}`;
        const filePath = `guidelines/${uniqueFileName}`;

        // Attempt upload to 'documents' bucket with upsert
        let uploadResult = await supabase.storage.from('documents').upload(filePath, selectedFile, { upsert: true });
        let bucketUsed = 'documents';

        if (uploadResult.error) {
          // Fallback to 'guidelines' bucket if 'documents' fails
          uploadResult = await supabase.storage.from('guidelines').upload(filePath, selectedFile, { upsert: true });
          bucketUsed = 'guidelines';
          if (uploadResult.error) {
            throw new Error(uploadResult.error.message || 'Storage upload policy restricted this action.');
          }
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketUsed)
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          fileUrl = publicUrlData.publicUrl;
        }
        fileName = selectedFile.name;
      }

      const { error: updateError } = await supabase
        .from('knowledge_guidelines')
        .update({
          title: editTitle,
          file_name: fileName,
          file_url: fileUrl,
          uploaded_by: currentUser?.employee_name || editingDoc.uploaded_by
        })
        .eq('id', editingDoc.id);

      if (updateError) throw updateError;

      setSuccessMessage('Guideline and file version updated successfully!');
      setTimeout(() => {
        setEditingDoc(null);
        fetchData();
      }, 1200);

    } catch (err) {
      console.error('Error updating guideline file:', err);
      alert(`Failed to replace file: ${err.message || 'Check Supabase RLS storage policies.'}`);
    } finally {
      setUpdating(false);
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesDept = activeTab === 'All' || doc.department === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  return (
    <div style={{ background: '#ffffff', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '600px', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#2563eb" /> Knowledge Base & SOP Guidelines
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Access standard operating procedures, documentation, and update guideline versions.</p>
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search guidelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Department Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('All')}
          style={{
            padding: '10px 16px',
            background: activeTab === 'All' ? '#eff6ff' : 'transparent',
            color: activeTab === 'All' ? '#2563eb' : '#64748b',
            border: activeTab === 'All' ? '1px solid #bfdbfe' : '1px solid transparent',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>All Departments</span>
          <span style={{ background: activeTab === 'All' ? '#dbeafe' : '#f1f5f9', color: activeTab === 'All' ? '#1d4ed8' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
            {documents.length}
          </span>
        </button>

        {departmentsList.map((dept) => {
          const count = documents.filter(d => d.department === dept).length;
          const isActive = activeTab === dept;
          return (
            <button
              key={dept}
              onClick={() => setActiveTab(dept)}
              style={{
                padding: '10px 16px',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#2563eb' : '#64748b',
                border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{dept}</span>
              <span style={{ background: isActive ? '#dbeafe' : '#f1f5f9', color: isActive ? '#1d4ed8' : '#64748b', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '14px' }}>Loading guidelines...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <BookOpen size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
              <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px', color: '#475569' }}>No guidelines found</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Try adjusting your search or selecting a different department tab.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' }}>
                      {getFileIcon(doc.file_name)}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px' }}>
                        {doc.department}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: '#2563eb' }}
                        title="Update Title / Replace File Version"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4', wordBreak: 'break-word' }}>
                    {highlightMatch(doc.title, searchTerm)}
                  </h3>
                  
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', wordBreak: 'break-all' }}>
                    📁 {highlightMatch(doc.file_name || 'Attached File', searchTerm)}
                  </p>
                </div>

                <div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={12} color="#94a3b8" />
                      <span>Updated by <strong>{doc.uploaded_by || 'Administrator'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} color="#94a3b8" />
                      <span>{new Date(doc.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {doc.file_url && (
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginTop: '14px', width: '100%', padding: '8px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', boxSizing: 'border-box' }}
                    >
                      <Download size={13} /> View / Download File
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit / Replace Modal */}
      {editingDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#2563eb" /> Update Guideline & File
              </h3>
              <button 
                onClick={() => setEditingDoc(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
              >
                <X size={16} />
              </button>
            </div>

            {successMessage ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '16px', borderRadius: '8px', textAlign: 'center', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> {successMessage}
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Document Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Replace File (Supported: PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX)
                  </label>
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                    <Upload size={22} color="#64748b" style={{ marginBottom: '6px' }} />
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                      {selectedFile ? selectedFile.name : 'Choose a new file to replace current version'}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#94a3b8' }}>Current: {editingDoc.file_name || 'None'}</p>
                    <input 
                      type="file"
                      id="update-file-input"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor="update-file-input"
                      style={{ display: 'inline-block', padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Browse New File
                    </label>
                  </div>
                  {fileError && <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>{fileError}</p>}
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', color: '#b45309' }}>
                  ℹ️ Note: Deletion is restricted. You can update titles or replace the file version at any time.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={updating}
                    style={{ padding: '9px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', opacity: updating ? 0.7 : 1 }}
                  >
                    {updating ? 'Saving Changes...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}