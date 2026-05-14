import { useState, useRef, useEffect, ChangeEvent } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { User, Mail, Phone, ShieldCheck, Camera, Save, X, Loader2, Upload, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    avatar: '',
    avatarUrl: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Sync with user context
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U',
        avatarUrl: user.avatarUrl || '',
        streetAddress: user.streetAddress || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
        streetAddress: profile.streetAddress,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode
      });
      setIsEditing(false);
      alert("Profile updated successfully in database!");
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900">Profile Settings</h1>
            <p className="text-neutral-500 mt-1">Manage your personal information and account security.</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-sm shadow-lg shadow-neutral-200 hover:bg-neutral-800 transition-all"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 font-bold text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-sm overflow-hidden text-left">
          {/* Header Banner */}
          <div className="h-32 bg-neutral-900 relative">
            <div className={`absolute -bottom-12 left-8 p-1 rounded-[24px] bg-white shadow-xl`}>
              <button 
                onClick={handleImageClick}
                disabled={!isEditing}
                className={`group relative size-24 rounded-[20px] bg-neutral-100 flex items-center justify-center border-4 border-white overflow-hidden transition-all ${isEditing ? "cursor-pointer hover:border-neutral-900" : "cursor-default"}`}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-3xl font-bold text-neutral-900">{profile.avatar}</span>
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} />
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Change</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </button>
            </div>
          </div>

          <div className="pt-16 p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.fullName}
                    autoComplete="name"
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                    }`}
                  />
                  <User className={`absolute right-4 top-1/2 -translate-y-1/2 ${isEditing ? "text-neutral-900" : "text-neutral-300"}`} size={18} />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={profile.email}
                    autoComplete="email"
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                    }`}
                  />
                  <Mail className={`absolute right-4 top-1/2 -translate-y-1/2 ${isEditing ? "text-neutral-900" : "text-neutral-300"}`} size={18} />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={profile.phone}
                    autoComplete="tel"
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                    }`}
                  />
                  <Phone className={`absolute right-4 top-1/2 -translate-y-1/2 ${isEditing ? "text-neutral-900" : "text-neutral-300"}`} size={18} />
                </div>
              </div>

              {/* Verification Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Verification Status</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 h-[50px]">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">A-Rank Verified Borrower</span>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="pt-8 border-t border-neutral-50">
               <h3 className="text-lg font-bold font-display text-neutral-900 mb-6 flex items-center gap-2">
                  <MapPin size={20} />
                  Residence Address
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Street Address */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Street Address</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="Enter your street address"
                      value={profile.streetAddress}
                      autoComplete="street-address"
                      onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                      }`}
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">City</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      placeholder="e.g. New York"
                      value={profile.city}
                      autoComplete="address-level2"
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                      }`}
                    />
                  </div>

                  {/* State & Zip */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">State</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="NY"
                        value={profile.state}
                        autoComplete="address-level1"
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                          isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Zip Code</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="10001"
                        value={profile.zipCode}
                        autoComplete="postal-code"
                        onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                        className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                          isEditing ? "bg-white border-2 border-neutral-900 shadow-sm focus:ring-0" : "bg-neutral-50 border-2 border-transparent text-neutral-500"
                        }`}
                      />
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-neutral-50 flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Member since January 2024
              </div>
              <button className="text-xs font-bold text-red-500 hover:underline">
                Sign out from all devices
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
