"use client";

import { useEffect, useMemo, useState } from 'react';

interface EmployeeRow {
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
  department?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  idCardFront?: string;
  profileImage?: string;
}

export default function EmployeesListTable() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/employees/list?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setRows(data.employees || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSearch = () => {
    setPage(1);
    load();
  };

  return (
    <div className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Employees</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Search by Employee ID or Email"
              className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#091e65]"
            />
          </div>
          <button
            onClick={onSearch}
            className="px-4 py-2 rounded-lg bg-[#091e65] text-white text-sm hover:bg-[#1e3a8a]"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">Profile</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">Employee</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">Designation</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">Department</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-500">No employees found</td>
              </tr>
            )}
            {!loading && rows.map((e) => (
              <tr key={e.employeeId} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#091e65] to-[#dc2626] text-white flex items-center justify-center ring-1 ring-gray-100">
                    {e.profileImage ? (
                      <img src={e.profileImage} alt={e.name} className="w-full h-full object-cover" />
                    ) : e.idCardFront ? (
                      <img src={e.idCardFront} alt={e.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1118.364 4.56 9 9 0 015.12 17.804z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-gray-900">{e.name}</div>
                  <div className="text-xs text-gray-500">{e.employeeId} • {e.email}</div>
                </td>
                <td className="px-3 py-3 text-gray-800">{e.designation || '-'}</td>
                <td className="px-3 py-3 text-gray-800">{e.department || '-'}</td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    e.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-gray-600">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {totalPages} • {total} total</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}


