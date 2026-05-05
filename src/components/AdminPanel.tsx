import React, { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { Shield, Users, Key, Trash2, LayoutDashboard, Search, Edit2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";

export function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<React.ReactNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const fetchUsers = async () => {
    try {
      if (!auth?.currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setErrorState(null);
      const token = await auth.currentUser.getIdToken();
      const url = "/api/admin/users";
      console.log(`[ADMIN] Fetching from ${url}`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        let errorMsg = `Server error ${res.status}`;
        const rawText = await res.text();
        try {
          const data = JSON.parse(rawText);
          if (data.error === "SERVICE_ACCOUNT_REQUIRED") {
            const details = data.details || "";
            const projectId = data.projectId || "your-project-id";
            const enableUrl = `https://console.developers.google.com/apis/api/identitytoolkit.googleapis.com/overview?project=${projectId}`;
            
            setErrorState(
              <div className="space-y-4">
                <p>{data.message}</p>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-xs text-left font-mono break-all max-h-32 overflow-y-auto text-rose-300">
                  {details}
                </div>
                <Button 
                  onClick={() => window.open(enableUrl, "_blank")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 w-full sm:w-auto"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Enable Identity Toolkit API
                </Button>
              </div>
            );
            return;
          }
          errorMsg = data.error || errorMsg;
        } catch (e) {
          errorMsg = `Server returned ${res.status}: ${rawText.substring(0, 100).replace(/\n/g, "")}`;
        }
        throw new Error(errorMsg);
      }
      
      const contentType = res.headers.get("content-type") || "";
      const rawBody = await res.text();
      
      if (contentType.includes("application/json")) {
        try {
          const data = JSON.parse(rawBody);
          setUsers(data);
        } catch (e) {
          console.error(`[ADMIN] Failed to parse JSON from ${url}:`, rawBody);
          throw new Error(`Invalid JSON response from server. Status: ${res.status}`);
        }
      } else {
        console.error(`[ADMIN] Non-JSON response from ${url}:`, rawBody);
        const preview = rawBody.substring(0, 100).replace(/\n/g, " ");
        throw new Error(`Expected JSON but received ${contentType || "unknown content"}. Status: ${res.status}. Preview: ${preview}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    try {
      if (!auth?.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${selectedUser.uid}/password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (!res.ok) {
        let errorData = "Failed to update password";
        const rawText = await res.text();
        try {
           const parsed = JSON.parse(rawText);
           errorData = parsed.error || errorData;
        } catch(e) {}
        throw new Error(errorData as string);
      }
      
      toast.success("Password updated successfully!");
      setPasswordModalOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      if (!auth?.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
         let errMsg = "Failed to delete user";
         const rawText = await res.text();
         try {
            const data = JSON.parse(rawText);
            errMsg = data.error || errMsg;
         } catch(e) {}
         throw new Error(errMsg);
      }
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#0A0A0B] text-slate-100 selection:bg-fuchsia-500/30">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-xl shadow-lg shadow-fuchsia-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Admin Command Center</h1>
            </div>
            <p className="text-slate-400 pl-14">Manage users, adjust security credentials, and oversee the platform.</p>
          </div>
          
          <div className="hidden md:flex gap-3 text-sm">
            <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg flex flex-col items-center">
               <span className="text-slate-400 font-medium">Total Users</span>
               <span className="text-xl font-bold text-white">{users.length}</span>
            </div>
          </div>
        </div>

        {/* Filters/Search */}
        <div className="flex items-center gap-4 bg-slate-900/40 p-4 border border-slate-800/80 rounded-2xl backdrop-blur-md relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none"></div>
           <Search className="w-5 h-5 text-slate-400 ml-2" />
           <Input 
             placeholder="Search by email or name..." 
             className="bg-transparent border-none shadow-none text-base focus-visible:ring-0 px-2 h-auto text-slate-200 placeholder:text-slate-500"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
        </div>

        {/* Users Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Authentication</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created / Last Login</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                        <span>Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : errorState ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-md mx-auto">
                         <div className="p-3 bg-rose-500/10 rounded-full">
                           <AlertCircle className="w-8 h-8 text-rose-500" />
                         </div>
                         <h3 className="text-lg font-medium text-slate-200">Configuration Required</h3>
                         <p className="text-sm text-slate-400">{errorState}</p>
                         <div className="pt-2 text-xs text-slate-500 max-w-sm">
                           Firebase Admin requires Server-to-Server credentials to list and modify authentication accounts directly.
                         </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 font-bold shadow-inner">
                            {user.email?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200">{user.displayName || "Unknown Name"}</div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.providers?.map((p: string) => (
                            <span key={p} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        <div>{user.creationTime ? new Date(user.creationTime).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-xs text-slate-600 mt-0.5">{user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleDateString() : 'Never'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-slate-400 hover:text-white hover:bg-slate-700/50"
                            onClick={() => {
                              setSelectedUser(user);
                              setPasswordModalOpen(true);
                            }}
                          >
                            <Key className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={() => handleDeleteUser(user.uid)}
                            disabled={user.email === 'sabledattatray@gmail.com'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="bg-[#111113] border-slate-800 text-slate-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-400">
              Enter a new password for <strong className="text-white">{selectedUser?.email}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="bg-slate-900 border-slate-800"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="hover:bg-slate-800" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white" onClick={handleChangePassword}>Save Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
