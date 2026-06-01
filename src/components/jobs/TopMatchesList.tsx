"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PaginationControls from "./PaginationControls";
import {
  ExternalLink,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  BuildingIcon,
  MapPinIcon,
  BarChart3Icon,
  FileText,
  Link as SocialLink,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { Job } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";

interface TopMatchesListProps {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
}

export default function TopMatchesList({
  jobs,
  currentPage,
  totalPages,
}: TopMatchesListProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingInterest, setIsUpdatingInterest] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);

  // Keep ref up to date without adding searchParams to the main effect's deps
  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  // Only re-run when the jobs list changes (i.e. when the page changes)
  useEffect(() => {
    const currentSearchParams = searchParamsRef.current;
    const selectedJobIdFromUrl = currentSearchParams.get("selectedJobId");
    let jobToSelect: Job | null = null;

    if (selectedJobIdFromUrl) {
      jobToSelect =
        jobs.find((job) => job.job_id === selectedJobIdFromUrl) || null;
    }

    if (!jobToSelect && jobs.length > 0) {
      jobToSelect = jobs[0];
      // Always update URL with the correct selected job ID for this page
      const params = new URLSearchParams(currentSearchParams.toString());
      params.set("selectedJobId", jobToSelect.job_id);
      router.replace(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    } else if (jobs.length === 0) {
      jobToSelect = null;
    }

    if (selectedJob?.job_id !== jobToSelect?.job_id) {
      setSelectedJob(jobToSelect);
    }
  }, [jobs]); // Only depends on jobs — no infinite loop

  const handleViewResume = (
    job_id: string,
    resume_id: string | null | undefined,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedJob) {
      params.set("selectedJobId", selectedJob.job_id);
    }
    params.set("source", window.location.pathname);
    router.push(`/jobs/${job_id}/resumes/${resume_id}?${params.toString()}`);
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    const params = new URLSearchParams(searchParams.toString());
    params.set("selectedJobId", job.job_id);
    router.replace(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleMarkAsApplied = async () => {
    if (!selectedJob || selectedJob.status === "applied") {
      return;
    }

    setIsUpdating(true);
    try {
      const currentDate = new Date().toISOString();
      const response = await fetch(`/api/jobs/${selectedJob.job_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "applied",
          application_date: currentDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const updatedJob: Job = await response.json();
      setSelectedJob(updatedJob);
      showToast("Job marked as applied successfully!", "success");
      router.refresh();
    } catch (error) {
      console.error("Error marking job as applied:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSetInterest = async (newInterestValue: boolean | null) => {
    if (!selectedJob) {
      return;
    }

    setIsUpdatingInterest(true);
    let finalInterestValue: boolean | null;

    if (selectedJob.is_interested === newInterestValue) {
      finalInterestValue = null;
    } else {
      finalInterestValue = newInterestValue;
    }

    try {
      const response = await fetch(`/api/jobs/${selectedJob.job_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_interested: finalInterestValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const updatedJob: Job = await response.json();
      setSelectedJob(updatedJob);

      const message =
        finalInterestValue === true
          ? "Marked as interested"
          : finalInterestValue === false
            ? "Marked as not interested"
            : "Interest status cleared";
      showToast(message, "success");
      router.refresh();
    } catch (error) {
      console.error("Error updating job interest:", error);
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(`Error: ${message}`, "error");
    } finally {
      setIsUpdatingInterest(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    console.log(`Toast (${type}): ${message}`);
    if (type === "error") {
      alert(message);
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  function EmptyState() {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <p className="text-gray-500 text-sm">No jobs found.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left Column: Job List */}
      <div className="w-full md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-y-auto flex flex-col">
        {jobs.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-100 flex-grow">
              {jobs.map((job) => (
                <li
                  key={job.job_id}
                  onClick={() => handleJobSelect(job)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedJob?.job_id === job.job_id
                      ? "bg-indigo-50 border-l-2 border-indigo-500"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                      {job.job_title}
                    </h3>
                    {job.resume_score && (
                      <span
                        className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreBadgeColor(
                          job.resume_score,
                        )}`}
                      >
                        {job.resume_score}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{job.company}</p>
                  <div className="flex flex-wrap gap-1">
                    {job.status === "applied" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Applied
                      </span>
                    )}
                    {job.is_interested === true && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Interested
                      </span>
                    )}
                    {job.is_interested === false && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        Not Interested
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 bg-white">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Right Column: Job Details */}
      <div className="w-full md:w-2/3 bg-white overflow-y-auto">
        {selectedJob ? (
          <div className="h-full flex flex-col">
            {/* Header section with fixed position */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedJob.job_title}
                  </h2>
                  <div className="mt-2 flex items-center text-gray-700 space-x-4">
                    <div className="flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span>{selectedJob.company}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span>{selectedJob.location}</span>
                    </div>
                    <div className="flex items-center">
                      <SocialLink className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="capitalize truncate">
                        {selectedJob.provider === "careers_future"
                          ? "MyCareersFuture"
                          : "LinkedIn"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedJob.resume_score && (
                  <div className="flex items-center space-x-1.5 bg-gray-50 px-3 py-2 rounded-lg">
                    <BarChart3Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="flex items-baseline">
                        <span className="text-lg font-semibold text-gray-900">
                          {selectedJob.resume_score}
                        </span>
                        <span className="ml-1 text-xs text-gray-500">/100</span>
                      </div>
                      {selectedJob.resume_score_stage && (
                        <span className="text-xs text-gray-500 block">
                          {selectedJob.resume_score_stage
                            .charAt(0)
                            .toUpperCase() +
                            selectedJob.resume_score_stage.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-5">
                {(() => {
                  let jobUrl;
                  if (selectedJob.provider === "careers_future") {
                    jobUrl = `https://www.mycareersfuture.gov.sg/job/${selectedJob.job_id}`;
                  } else {
                    jobUrl = `https://www.linkedin.com/jobs/view/${selectedJob.job_id}`;
                  }

                  return (
                    <Link
                      href={jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Job Listing
                      <ExternalLink size={16} className="ml-2" />
                    </Link>
                  );
                })()}

                {selectedJob.resume_link && (
                  <button
                    onClick={() =>
                      handleViewResume(
                        selectedJob.job_id,
                        selectedJob.customized_resume_id,
                      )
                    }
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    View Resume
                    <FileText size={16} className="ml-2" />
                  </button>
                )}

                {selectedJob.status !== "applied" ? (
                  <button
                    onClick={handleMarkAsApplied}
                    disabled={isUpdating}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    {isUpdating ? "Updating..." : "Mark as Applied"}
                  </button>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-md">
                    <CheckCircle size={16} className="mr-2" />
                    Applied
                  </div>
                )}

                {/* Interest buttons */}
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => handleSetInterest(true)}
                    disabled={isUpdatingInterest}
                    className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed
                      ${
                        selectedJob.is_interested === true
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <ThumbsUp
                      size={16}
                      className="mr-2"
                      fill={
                        selectedJob.is_interested === true
                          ? "currentColor"
                          : "none"
                      }
                    />
                    Interested
                  </button>

                  <button
                    onClick={() => handleSetInterest(false)}
                    disabled={isUpdatingInterest}
                    className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-300
                      ${
                        selectedJob.is_interested === false
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <ThumbsDown
                      size={16}
                      className="mr-2"
                      fill={
                        selectedJob.is_interested === false
                          ? "currentColor"
                          : "none"
                      }
                    />
                    Not Interested
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content for description */}
            <div className="p-6 flex-grow">
              <div className="prose max-w-none">
                <MarkdownRenderer content={selectedJob.description} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
}
