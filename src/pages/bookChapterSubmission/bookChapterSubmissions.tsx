// import { useState, useMemo } from 'react';
// import type { Submission, FilterOptions } from '../../types/submissionTypes';
// import { dummySubmissions, archivedSubmissions } from '../../data/dummySubmissions';
// import SubmissionFilters from '../submissions/submissionFilters';
// import SubmissionCard from '../submissions/submissionCard';
// import HistoryPopup from '../submissions/historyPopup';
// import DiscussionPopup from '../submissions/discussionsPopup';

// type TabType = 'queue' | 'archives';

// export default function BookChapterSubmissions() {
//   const [activeTab, setActiveTab] = useState<TabType>('queue');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
//   const [showHistory, setShowHistory] = useState(false);
//   const [showDiscussions, setShowDiscussions] = useState(false);
//   const [filters, setFilters] = useState<FilterOptions>({
//     overdue: false,
//     incomplete: false,
//     stages: [],
//     activity: [],
//     sections: []
//   });

//   // Get submissions based on active tab
//   const submissions = activeTab === 'queue' ? dummySubmissions : archivedSubmissions;

//   // Filter submissions
//   const filteredSubmissions = useMemo(() => {
//     return submissions.filter(submission => {
//       // Search filter
//       if (searchQuery && !submission.title.toLowerCase().includes(searchQuery.toLowerCase())) {
//         return false;
//       }

//       // Overdue filter
//       if (filters.overdue && !submission.isOverdue) {
//         return false;
//       }

//       // Incomplete filter
//       if (filters.incomplete && !submission.isIncomplete) {
//         return false;
//       }

//       // Stages filter
//       if (filters.stages.length > 0 && !filters.stages.includes(submission.stage)) {
//         return false;
//       }

//       // Sections filter
//       if (filters.sections.length > 0) {
//         const submissionSection = submission.metadata?.section;
//         if (!submissionSection || !filters.sections.includes(submissionSection)) {
//           return false;
//         }
//       }

//       return true;
//     });
//   }, [submissions, searchQuery, filters]);

//   const handleViewHistory = (submission: Submission) => {
//     setSelectedSubmission(submission);
//     setShowHistory(true);
//   };

//   const handleViewDiscussions = (submission: Submission) => {
//     setSelectedSubmission(submission);
//     setShowDiscussions(true);
//   };

//   const handleViewDetails = (submission: Submission) => {
//     // Navigate to submission details page
//   };

//   const handleAddDiscussion = (message: string) => {
//     // API call to add discussion
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <nav className="flex gap-8">
//             <button
//               onClick={() => setActiveTab('queue')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
//                 activeTab === 'queue'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               My Queue
//               <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
//                 activeTab === 'queue'
//                   ? 'bg-blue-100 text-blue-600'
//                   : 'bg-gray-100 text-gray-600'
//               }`}>
//                 {dummySubmissions.length}
//               </span>
//             </button>
//             <button
//               onClick={() => setActiveTab('archives')}
//               className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
//                 activeTab === 'archives'
//                   ? 'border-blue-500 text-blue-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               Archives
//             </button>
//           </nav>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="flex flex-col lg:flex-row gap-6">
//           {/* Filters Sidebar */}
//           <div className="lg:sticky lg:top-6 lg:self-start">
//             <SubmissionFilters filters={filters} onFilterChange={setFilters} />
//           </div>

//           {/* Submissions List */}
//           <div className="flex-1 min-w-0">
//             {/* Header with Search and New Submission */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
//               <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//                 <div className="flex-1 w-full sm:max-w-md">
//                   <div className="relative">
//                     <svg
//                       className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                       />
//                     </svg>
//                     <input
//                       type="text"
//                       placeholder="Search submissions..."
//                       value={searchQuery}
//                       onChange={(e) => setSearchQuery(e.target.value)}
//                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>

//                 <div className="flex gap-3 w-full sm:w-auto">
//                   <button className="flex-1 sm:flex-none px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
//                     Filters
//                   </button>
//                   <button className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                     </svg>
//                     New Submission
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Content Title */}
//             <div className="mb-4">
//               <h2 className="text-lg font-semibold text-gray-800">
//                 {activeTab === 'queue' ? 'My Assigned' : 'Archived Submissions'}
//               </h2>
//               <p className="text-sm text-gray-500 mt-1">
//                 {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} found
//               </p>
//             </div>

//             {/* Submissions List */}
//             {filteredSubmissions.length === 0 ? (
//               <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//                 <svg
//                   className="w-16 h-16 mx-auto text-gray-300 mb-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                   />
//                 </svg>
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
//                 <p className="text-gray-500">
//                   {searchQuery
//                     ? 'Try adjusting your search or filters'
//                     : 'You have no submissions in this category'}
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {filteredSubmissions.map((submission) => (
//                   <SubmissionCard
//                     key={submission.id}
//                     submission={submission}
//                     onViewHistory={handleViewHistory}
//                     onViewDiscussions={handleViewDiscussions}
//                     onViewDetails={handleViewDetails}
//                   />
//                 ))}
//               </div>
//             )}

//             {/* Last Activity Notice */}
//             {filteredSubmissions.length > 0 && (
//               <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                 <div className="flex items-start gap-3">
//                   <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <div>
//                     <p className="text-sm text-blue-900 font-medium">
//                       Last activity recorded on {new Date().toLocaleDateString('en-US', {
//                         weekday: 'long',
//                         year: 'numeric',
//                         month: 'long',
//                         day: 'numeric'
//                       })}.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* History Popup */}
//       {showHistory && selectedSubmission && (
//         <HistoryPopup
//           history={selectedSubmission.history}
//           submissionTitle={selectedSubmission.title}
//           onClose={() => {
//             setShowHistory(false);
//             setSelectedSubmission(null);
//           }}
//         />
//       )}

//       {/* Discussion Popup */}
//       {showDiscussions && selectedSubmission && (
//         <DiscussionPopup
//           discussions={selectedSubmission.discussions}
//           submissionTitle={selectedSubmission.title}
//           onAddDiscussion={handleAddDiscussion}
//           onClose={() => {
//             setShowDiscussions(false);
//             setSelectedSubmission(null);
//           }}
//         />
//       )}
//     </div>
//   );
// }