# Projects Implementation Plan

**Components**: `ProjectList.tsx`, `AddProject.tsx`
**Route**: `/dashboard/projects`, `/dashboard/new-project`

## Purpose
Allows users to view all their traffic campaigns and create new ones.

## Features
*   [x] **Project List**:
    *   [x] Search and Filter (by status, date).
    *   [x] Pagination.
    *   [x] Status indicators (Running, Paused, Completed).
*   [x] **Add Project Wizard**:
    *   [x] Step-by-step creation flow.
    *   [x] Target URL validation.
    *   [x] Traffic configuration (Volume, Bounce Rate, Duration).
    *   [x] Geo-targeting selection.

## Planned Improvements
*   [x] **Bulk Actions**: Select multiple projects to Pause, Resume, or Delete.
*   [ ] **Project Templates**: Save configuration as template for fast creation.
*   [ ] **Estimated Completion**: Calculate and show when the target hits will be reached.
*   [ ] **Duplicate Project**: One-click clone of an existing campaign.
*   [ ] **Favicon Fetcher**: Auto-display the favicon of the target URL in the list.
*   [ ] **Traffic Scheduler**: Specific start/end dates for campaigns.
*   [ ] **Project Tags**: Allow users to tag projects (e.g., "Client A", "Testing") and filter by tag.
*   [ ] **Velocity Sort**: Sort projects by hits-per-minute.
*   [ ] **Quick Edit**: Inline edit for simple fields (Name, Max Hits) without opening details.
*   [ ] **Archive**: Move old projects to an "Archived" tab instead of deleting.
*   [ ] **CSV Import**: Create multiple projects from a CSV file upload.
*   [ ] **Compact View**: Toggle between "Card" and "Table" view.
*   [ ] **Status Filter**: "Only show Running" toggle switch.
*   [ ] **Sort by Cost**: Sort projects by credits consumed.
*   [ ] **Last Modified**: Show "Edited 2 hours ago" timestamp.
*   [ ] **Cost Per Hit**: Column showing average CPC for this project.
*   [ ] **Target Preview**: Hover over URL to see thumbnail preview.
*   [ ] **Error Badge**: Red dot if project has failed hits recently.
*   [ ] **One-Click Restart**: Restart completed campaign with same settings.
*   [ ] **Favorite Project**: Star generic to pin to top of list.
*   [ ] **Multi-Select Tagging**: Apply tag to 10 projects at once.
*   [ ] **Keyboard Nav**: Up/Down arrows to move selection in list.
*   [ ] **Copy URL**: Button to copy target URL to clipboard.
*   [ ] **Reset Stats**: Clear hit counter for fresh start (maintain settings).
*   [ ] **Notes Tooltip**: Hover icon to see project notes summary.
*   [ ] **Drag to Reorder**: Manually sort priority of projects.
*   [ ] **Project Grouping**: Folder system for organizing campaigns.
*   [ ] **External ID**: Field to store client's internal ID for reference.
*   [ ] **Share Snapshot**: Generate an image of the project config to share.
*   [ ] **Batch Speed Edit**: "Set all selected to 500 hits/hr".
*   [ ] **Auto-Delete**: "Delete this project after completion" toggle.
*   [ ] **Broken Link Check**: Warning if target URL returns 404.
*   [ ] **SSL Check**: Warning if target URL has expired certificate.
*   [ ] **Redirect Warning**: "Note: Target URL redirects to X".
*   [ ] **Domain Filter**: Quick filter to show all projects for "example.com".
*   [ ] **Mobile Optimization**: "Hide Columns" modal for small screens.
*   [ ] **Excel Export**: Download project list as .xlsx.
*   [ ] **Quick Budget**: Input box to add credits to project directly in list.
*   [ ] **Traffic Source Icon**: Show icon for "Organic" vs "Direct" vs "Social" type.
*   [ ] **History Log**: "View Audit Log" right-click menu item.
*   [ ] **Batch Tagging**: Drag and drop projects onto tag sidebar.
*   [ ] **Performance Sparkline**: Mini chart in table row showing last 24h traffic.
*   [ ] **Project Owner**: (Team) show avatar of who created the project.
*   [ ] **Smart Sort**: "Sort by Issue" (puts errors/warnings at top).
*   [ ] **Description**: Optional text field for project description.
*   [ ] **Cost forecast**: "Will cost $50 to finish" column.
*   [ ] **Pin to Dashboard**: "Show this project on home screen" toggle.
*   [ ] **API ID**: "Copy UUID" button for developer reference.
*   [ ] **Test Run**: "Send 1 hit now" quick action.
*   [ ] **Campaign Age**: "Created 5 months ago" column.

