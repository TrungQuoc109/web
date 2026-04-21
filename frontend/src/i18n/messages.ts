import type { AppLanguage } from "@/i18n/languageStore";

type TranslationParams = Record<string, string | number>;
type TranslationValue = string | ((params?: TranslationParams) => string);

type TranslationTree = {
  [key: string]: TranslationValue | TranslationTree;
};

const messages: Record<AppLanguage, TranslationTree> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      projects: "Projects",
      tasks: "Tasks",
      members: "Members",
      messages: "Messages",
      notifications: "Notifications",
      settings: "Settings",
    },
    sidebar: {
      workspace: "Workspace",
      title: "Project Hub",
      expand: "Expand sidebar",
      collapse: "Collapse sidebar",
      teamWorkspace: "Team workspace",
      teamWorkspaceDescription:
        "Focused shell for projects, tasks, messages, and updates.",
    },
    routeError: {
      title: "Something went wrong",
      requestedPageFailed: "The requested page could not be loaded.",
      unexpected: "An unexpected application error interrupted this route.",
      label: "Route error",
      reload: "Reload page",
      backToDashboard: "Back to dashboard",
    },
    auth: {
      common: {
        email: "Email",
        password: "Password",
      },
      validation: {
        email: "Please enter a valid email",
        passwordLength: "Password must be at least 8 characters",
        nameLength: "Name must be at least 2 characters",
      },
      login: {
        title: "Welcome back",
        subtitle: "Sign in to continue.",
        signingIn: "Signing in...",
        submit: "Sign in",
        noAccount: "No account?",
        createOne: "Create one",
      },
      register: {
        title: "Create account",
        subtitle: "Register to start managing projects.",
        nameOptional: "Name (optional)",
        creating: "Creating...",
        submit: "Create account",
        hasAccount: "Already have an account?",
        signIn: "Sign in",
        success: "Account created successfully. Please sign in to continue.",
      },
    },
    invite: {
      signInRequired: "Sign in to accept the project invitation.",
      preparing: "Preparing invitation...",
      joiningTitle: "Joining project",
      joiningDescription:
        "We're validating the invitation and adding your account to the project workspace now.",
      processing: "Processing invitation token...",
      acceptedTitle: "Invitation accepted",
      acceptedDescription:
        "You've joined the project successfully. Your workspace data has been refreshed and the project should now appear in your app.",
      openProjects: "Open projects",
      goDashboard: "Go to dashboard",
      unavailableTitle: "Invitation unavailable",
      signInAnother: "Sign in with another account",
    },
    dashboard: {
      workspace: "Workspace",
      title: "Dashboard",
      subtitle:
        "A clean operating view for project volume, task status, and recent team movement.",
      loading:
        "Loading your overview, current task distribution, and recent team activity.",
      unavailableTitle: "Dashboard unavailable",
      unavailableDescription:
        "The workspace overview could not be loaded from the backend. Retry to restore the dashboard cards and activity feed.",
      createProject: "Create project",
      createTask: "Create task",
      emptyTitle: "Your workspace is ready",
      emptyDescription:
        "Start by creating your first project or task. As work begins, stats and recent activity will appear automatically here.",
      totalProjects: "Total projects",
      totalProjectsHelp:
        "All tracked initiatives currently active in the workspace.",
      activeProjects: "Active projects",
      activeProjectsHelp: (params) =>
        `${params?.count ?? 0} project${params?.count === 1 ? "" : "s"} currently at risk.`,
      completionRate: "Completion rate",
      completionRateHelp: (params) =>
        `${params?.count ?? 0} tasks moved to done over the last seven days.`,
      needsAttention: "Needs attention",
      needsAttentionHelp: (params) =>
        `${params?.blocked ?? 0} blocked tasks and ${params?.pending ?? 0} pending reports need follow-up.`,
      inProgress: "In progress",
      inProgressHelp: "Tasks actively moving through delivery this moment.",
      reportsPending: "Reports pending",
      reportsPendingHelp:
        "Contributor submissions currently waiting for a lead decision.",
      chatActivity: "Chat activity",
      chatActivityHelp:
        "Project-level messages posted across the workspace this week.",
      quickActions: "Quick actions",
      quickActionsHelp:
        "Fast entry points for the most common project operations.",
      createProjectCard:
        "Start a new workspace with members, timelines, and milestones.",
      createTaskCard:
        "Add a new task, assign ownership, and move delivery forward.",
      openProjects: "Open projects",
      openProjectsCard:
        "Review project health, member counts, and progress in the full projects view.",
      tasksTracked: (params) => `${params?.count ?? 0} tasks tracked`,
      approvalRate: (params) => `${params?.count ?? 0}% approval rate`,
      teamMessages: (params) => `${params?.count ?? 0} team messages this week`,
      atRisk: (params) => `${params?.count ?? 0} at risk`,
      executionPulse: "Execution pulse",
      executionPulseHelp:
        "A short read on delivery pressure, review speed, and project health across the workspace.",
      atRiskProjects: "At-risk projects",
      atRiskProjectsHelp:
        "Projects carrying at least one blocked task.",
      avgReviewTurnaround: "Avg review turnaround",
      avgReviewTurnaroundHelp:
        "Average time from report submission to lead decision.",
      planningProjects: "Planning projects",
      planningProjectsHelp:
        "Workspaces without active task execution yet.",
      reviewedReports: "Reviewed reports",
      reviewedReportsHelp:
        "Reports that already received a lead decision.",
    },
    common: {
      loadingPage: "Loading page...",
      open: "Open",
      retry: "Retry",
      read: "Read",
      unread: "Unread",
      you: "You",
      save: "Save",
      cancel: "Cancel",
      language: "Language",
      english: "English",
      vietnamese: "Vietnamese",
      updated: "Updated",
    },
    topbar: {
      title: "Project Management",
      subtitle: "Collaborative workspace",
      openNavigation: "Open navigation",
    },
    account: {
      openMenu: "Open account menu",
      menuLabel: "Account menu",
      fallbackUser: "Project user",
      sessionActive: "Session active",
      profile: "Profile",
      profileDescription: "Review your account details and role.",
      settings: "Settings",
      settingsDescription: "Open workspace and product settings.",
      security: "Security",
      securityDescription: "Session details and password support.",
      languageDescription: "Choose your preferred interface language.",
      signOut: "Sign out",
      signingOut: "Signing out...",
    },
    notifications: {
      buttonLabel: "Notifications",
      panelLabel: "Recent notifications",
      title: "Notifications",
      unreadCount: (params) => `${params?.count ?? 0} unread`,
      subtitle: "Assignments, mentions, announcements, and delivery updates.",
      markAllRead: "Mark All as Read",
      recentActivity: "Recent activity",
      itemsCount: (params) => `${params?.count ?? 0} items`,
      unavailableTitle: "Notifications unavailable",
      unavailableDescription:
        "We couldn't load your recent notifications right now.",
      emptyTitle: "No notifications yet",
      emptyDescription:
        "New assignments, mentions, and announcements will show up here.",
      markRead: "Mark Read",
      saving: "Saving...",
      newTaskAssignment: "New Task Assignment",
      taskStatusUpdated: "Task Status Updated",
      mentioned: "You Were Mentioned",
      projectAnnouncement: "Project Announcement",
      workspaceUpdate: "Workspace Update",
      system: "System",
      assignment: "Assignment",
      teamActivity: "Team Activity",
      taskActivity: "Task Activity",
      projectActivity: "Project Activity",
      taskMeta: (params) => `Task #${params?.id ?? ""}`,
      projectMeta: (params) => `Project #${params?.id ?? ""}`,
    },
    settings: {
      workspace: "Workspace",
      title: "Settings",
      description:
        "Review your current profile, session state, and the production features already connected in this portfolio workspace.",
      signOut: "Sign out",
      currentRole: "Current role",
      currentRoleHelp:
        "Active authorization role returned by the authenticated backend session.",
      profileStatus: "Profile status",
      profileReady: "Ready",
      profileStatusHelp:
        "Your account is hydrated in the frontend auth store and available across protected routes.",
      connectedModules: "Connected modules",
      connectedModulesHelp:
        "Auth, projects, tasks, messages, and notification summary are already wired to real APIs.",
      profile: "Profile",
      accountOverview: "Account overview",
      profileOverviewHelp:
        "Read-only identity details from the authenticated user profile.",
      name: "Name",
      displayNamePlaceholder: "Your display name",
      email: "Email",
      emailPlaceholder: "you@example.com",
      created: "Created",
      unavailable: "Unavailable",
      saveProfile: "Save profile",
      savingProfile: "Saving...",
      workspaceStatus: "Workspace status",
      featureCoverage: "Feature coverage",
      featureCoverageHelp:
        "A quick status board for the parts of the app currently backed by real services.",
      tasksBoard: "Tasks and project board",
      notificationUnread: "Notification unread count",
      notificationInbox: "Full notification inbox",
      live: "Live",
      openProjects: "Open projects",
      openNotifications: "Open notifications",
      languageSection: "Language",
      languageTitle: "Interface language",
      languageHelp:
        "Choose whether the app shell uses English or Vietnamese. Your preference is stored locally on this device.",
      languageEnglishTitle: "English",
      languageEnglishDescription:
        "Keep the interface in English for recruiter or interviewer demos.",
      languageVietnameseTitle: "Tiếng Việt",
      languageVietnameseDescription:
        "Hiển thị các phần giao diện toàn cục bằng tiếng Việt.",
      selected: "Selected",
      selectLanguage: "Use this language",
      security: "Security",
      sessionAccess: "Session and access",
      securityHelp:
        "Review the current authenticated session and the security capabilities that are already wired in the app.",
      sessionStatus: "Session status",
      authenticated: "Authenticated",
      sessionStatusHelp:
        "Your JWT-backed session is currently loaded in the frontend auth store.",
      passwordManagement: "Password management",
      availableNow: "Available now",
      passwordManagementHelp:
        "Rotate your password without leaving the app by confirming your current credentials first.",
      signOutCard: "Sign out",
      signOutCardHelp:
        "You can safely clear the current session from the account menu or with the button below.",
      changePassword: "Change password",
      changePasswordHelp:
        "Use a strong password with at least 8 characters. Your current session stays active after the update.",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmNewPassword: "Confirm new password",
      updatePassword: "Update password",
      updatingPassword: "Updating...",
      securityGuidance: "Security guidance",
      securityTip1:
        "Use a password you do not reuse in other environments or demo accounts.",
      securityTip2:
        "After updating your password, future sign-ins will require the new value immediately.",
      securityTip3:
        "If you are testing shared seed accounts, make sure teammates know the credential has changed.",
      passwordUpdateLive: "Password update live",
      validationEmailRequired: "Email is required.",
      validationNameShort: "Name must be at least 2 characters when provided.",
      validationCurrentPasswordRequired: "Current password is required.",
      validationNewPasswordShort:
        "New password must be at least 8 characters.",
      validationPasswordMismatch: "Password confirmation does not match.",
      validationPasswordSame:
        "New password must be different from the current password.",
    },
  },
  vi: {
    nav: {
      dashboard: "Tổng quan",
      projects: "Dự án",
      tasks: "Công việc",
      members: "Thành viên",
      messages: "Tin nhắn",
      notifications: "Thông báo",
      settings: "Cài đặt",
    },
    sidebar: {
      workspace: "Không gian làm việc",
      title: "Trung tâm dự án",
      expand: "Mở rộng thanh bên",
      collapse: "Thu gọn thanh bên",
      teamWorkspace: "Không gian nhóm",
      teamWorkspaceDescription:
        "Giao diện tập trung cho dự án, task, tin nhắn và cập nhật.",
    },
    routeError: {
      title: "Đã xảy ra lỗi",
      requestedPageFailed: "Không thể tải trang được yêu cầu.",
      unexpected: "Một lỗi ứng dụng ngoài dự kiến đã làm gián đoạn route này.",
      label: "Lỗi điều hướng",
      reload: "Tải lại trang",
      backToDashboard: "Quay về tổng quan",
    },
    auth: {
      common: {
        email: "Email",
        password: "Mật khẩu",
      },
      validation: {
        email: "Vui lòng nhập email hợp lệ",
        passwordLength: "Mật khẩu phải có ít nhất 8 ký tự",
        nameLength: "Tên phải có ít nhất 2 ký tự",
      },
      login: {
        title: "Chào mừng trở lại",
        subtitle: "Đăng nhập để tiếp tục.",
        signingIn: "Đang đăng nhập...",
        submit: "Đăng nhập",
        noAccount: "Chưa có tài khoản?",
        createOne: "Tạo mới",
      },
      register: {
        title: "Tạo tài khoản",
        subtitle: "Đăng ký để bắt đầu quản lý dự án.",
        nameOptional: "Tên (không bắt buộc)",
        creating: "Đang tạo...",
        submit: "Tạo tài khoản",
        hasAccount: "Đã có tài khoản?",
        signIn: "Đăng nhập",
        success: "Tạo tài khoản thành công. Vui lòng đăng nhập để tiếp tục.",
      },
    },
    invite: {
      signInRequired: "Hãy đăng nhập để chấp nhận lời mời vào dự án.",
      preparing: "Đang chuẩn bị lời mời...",
      joiningTitle: "Đang tham gia dự án",
      joiningDescription:
        "Hệ thống đang xác thực lời mời và thêm tài khoản của bạn vào workspace dự án.",
      processing: "Đang xử lý token lời mời...",
      acceptedTitle: "Đã chấp nhận lời mời",
      acceptedDescription:
        "Bạn đã tham gia dự án thành công. Dữ liệu workspace đã được làm mới và dự án sẽ xuất hiện trong ứng dụng.",
      openProjects: "Mở danh sách dự án",
      goDashboard: "Về trang tổng quan",
      unavailableTitle: "Lời mời không khả dụng",
      signInAnother: "Đăng nhập bằng tài khoản khác",
    },
    dashboard: {
      workspace: "Không gian làm việc",
      title: "Tổng quan",
      subtitle:
        "Góc nhìn điều hành gọn gàng cho khối lượng dự án, trạng thái task và hoạt động gần đây của nhóm.",
      loading:
        "Đang tải tổng quan, phân bố task và hoạt động gần đây của nhóm.",
      unavailableTitle: "Không thể tải trang tổng quan",
      unavailableDescription:
        "Không thể tải dữ liệu tổng quan từ backend. Hãy thử lại để khôi phục các thẻ số liệu và feed hoạt động.",
      createProject: "Tạo dự án",
      createTask: "Tạo task",
      emptyTitle: "Workspace của bạn đã sẵn sàng",
      emptyDescription:
        "Hãy bắt đầu bằng cách tạo dự án hoặc task đầu tiên. Khi công việc bắt đầu, số liệu và hoạt động gần đây sẽ tự động xuất hiện tại đây.",
      totalProjects: "Tổng số dự án",
      totalProjectsHelp:
        "Tất cả các sáng kiến hiện đang được theo dõi trong workspace.",
      activeProjects: "Dự án đang hoạt động",
      activeProjectsHelp: (params) =>
        `${params?.count ?? 0} dự án hiện đang ở trạng thái rủi ro.`,
      completionRate: "Tỷ lệ hoàn thành",
      completionRateHelp: (params) =>
        `${params?.count ?? 0} task đã được chuyển sang hoàn tất trong 7 ngày gần đây.`,
      needsAttention: "Cần chú ý",
      needsAttentionHelp: (params) =>
        `${params?.blocked ?? 0} task bị chặn và ${params?.pending ?? 0} báo cáo đang chờ xử lý.`,
      inProgress: "Đang thực hiện",
      inProgressHelp: "Các task đang được triển khai ngay lúc này.",
      reportsPending: "Báo cáo chờ duyệt",
      reportsPendingHelp:
        "Các báo cáo của contributor đang chờ lead ra quyết định.",
      chatActivity: "Hoạt động chat",
      chatActivityHelp:
        "Số tin nhắn cấp dự án được gửi trong workspace tuần này.",
      quickActions: "Thao tác nhanh",
      quickActionsHelp:
        "Điểm vào nhanh cho các thao tác dự án thường dùng nhất.",
      createProjectCard:
        "Khởi tạo workspace mới với thành viên, mốc thời gian và kế hoạch.",
      createTaskCard:
        "Tạo task mới, phân công người phụ trách và đẩy tiến độ đi tiếp.",
      openProjects: "Mở dự án",
      openProjectsCard:
        "Xem health, số lượng thành viên và tiến độ ở trang dự án đầy đủ.",
      tasksTracked: (params) => `${params?.count ?? 0} task đang theo dõi`,
      approvalRate: (params) => `${params?.count ?? 0}% tỷ lệ duyệt`,
      teamMessages: (params) => `${params?.count ?? 0} tin nhắn nhóm tuần này`,
      atRisk: (params) => `${params?.count ?? 0} đang rủi ro`,
      executionPulse: "Nhịp vận hành",
      executionPulseHelp:
        "Tóm tắt nhanh về áp lực delivery, tốc độ review và sức khỏe dự án trong toàn workspace.",
      atRiskProjects: "Dự án rủi ro",
      atRiskProjectsHelp:
        "Các dự án có ít nhất một task đang bị chặn.",
      avgReviewTurnaround: "Thời gian duyệt trung bình",
      avgReviewTurnaroundHelp:
        "Thời gian trung bình từ lúc gửi báo cáo đến khi lead quyết định.",
      planningProjects: "Dự án đang lập kế hoạch",
      planningProjectsHelp:
        "Các workspace chưa có task được triển khai thực tế.",
      reviewedReports: "Báo cáo đã duyệt",
      reviewedReportsHelp:
        "Các báo cáo đã được lead đưa ra quyết định.",
    },
    common: {
      loadingPage: "Đang tải trang...",
      open: "Mở",
      retry: "Thử lại",
      read: "Đã đọc",
      unread: "Chưa đọc",
      you: "Bạn",
      save: "Lưu",
      cancel: "Hủy",
      language: "Ngôn ngữ",
      english: "Tiếng Anh",
      vietnamese: "Tiếng Việt",
      updated: "Cập nhật",
    },
    topbar: {
      title: "Quản lý dự án",
      subtitle: "Không gian cộng tác",
      openNavigation: "Mở điều hướng",
    },
    account: {
      openMenu: "Mở menu tài khoản",
      menuLabel: "Menu tài khoản",
      fallbackUser: "Người dùng dự án",
      sessionActive: "Phiên đang hoạt động",
      profile: "Hồ sơ",
      profileDescription: "Xem thông tin tài khoản và vai trò của bạn.",
      settings: "Cài đặt",
      settingsDescription: "Mở cài đặt hệ thống và không gian làm việc.",
      security: "Bảo mật",
      securityDescription: "Xem thông tin phiên và hỗ trợ mật khẩu.",
      languageDescription: "Chọn ngôn ngữ hiển thị ưu tiên của bạn.",
      signOut: "Đăng xuất",
      signingOut: "Đang đăng xuất...",
    },
    notifications: {
      buttonLabel: "Thông báo",
      panelLabel: "Thông báo gần đây",
      title: "Thông báo",
      unreadCount: (params) => `${params?.count ?? 0} chưa đọc`,
      subtitle: "Phân công, nhắc tên, thông báo và cập nhật tiến độ.",
      markAllRead: "Đánh dấu tất cả đã đọc",
      recentActivity: "Hoạt động gần đây",
      itemsCount: (params) => `${params?.count ?? 0} mục`,
      unavailableTitle: "Không thể tải thông báo",
      unavailableDescription:
        "Hiện không thể tải danh sách thông báo gần đây của bạn.",
      emptyTitle: "Chưa có thông báo",
      emptyDescription:
        "Khi có phân công, nhắc tên hoặc thông báo mới, chúng sẽ xuất hiện tại đây.",
      markRead: "Đánh dấu đã đọc",
      saving: "Đang lưu...",
      newTaskAssignment: "Bạn được giao task mới",
      taskStatusUpdated: "Trạng thái task đã thay đổi",
      mentioned: "Bạn vừa được nhắc tên",
      projectAnnouncement: "Thông báo dự án",
      workspaceUpdate: "Cập nhật hệ thống",
      system: "Hệ thống",
      assignment: "Phân công",
      teamActivity: "Hoạt động nhóm",
      taskActivity: "Hoạt động task",
      projectActivity: "Hoạt động dự án",
      taskMeta: (params) => `Task #${params?.id ?? ""}`,
      projectMeta: (params) => `Dự án #${params?.id ?? ""}`,
    },
    settings: {
      workspace: "Không gian làm việc",
      title: "Cài đặt",
      description:
        "Xem hồ sơ hiện tại, trạng thái phiên đăng nhập và các tính năng production đã được kết nối trong workspace này.",
      signOut: "Đăng xuất",
      currentRole: "Vai trò hiện tại",
      currentRoleHelp:
        "Vai trò phân quyền đang hoạt động từ phiên backend đã đăng nhập.",
      profileStatus: "Trạng thái hồ sơ",
      profileReady: "Sẵn sàng",
      profileStatusHelp:
        "Tài khoản của bạn đã được nạp vào auth store và sẵn dùng trên các route bảo vệ.",
      connectedModules: "Module đã kết nối",
      connectedModulesHelp:
        "Auth, dự án, task, tin nhắn và phần tóm tắt thông báo đã được nối với API thật.",
      profile: "Hồ sơ",
      accountOverview: "Tổng quan tài khoản",
      profileOverviewHelp:
        "Thông tin định danh chỉ đọc từ hồ sơ người dùng đã đăng nhập.",
      name: "Tên",
      displayNamePlaceholder: "Tên hiển thị của bạn",
      email: "Email",
      emailPlaceholder: "ban@example.com",
      created: "Ngày tạo",
      unavailable: "Không có dữ liệu",
      saveProfile: "Lưu hồ sơ",
      savingProfile: "Đang lưu...",
      workspaceStatus: "Trạng thái workspace",
      featureCoverage: "Độ phủ tính năng",
      featureCoverageHelp:
        "Bảng trạng thái nhanh cho các phần của ứng dụng hiện đã được nối với service thật.",
      tasksBoard: "Task và bảng dự án",
      notificationUnread: "Số thông báo chưa đọc",
      notificationInbox: "Hộp thư thông báo đầy đủ",
      live: "Đang hoạt động",
      openProjects: "Mở dự án",
      openNotifications: "Mở thông báo",
      languageSection: "Ngôn ngữ",
      languageTitle: "Ngôn ngữ giao diện",
      languageHelp:
        "Chọn tiếng Anh hoặc tiếng Việt cho phần giao diện toàn cục. Tùy chọn này được lưu cục bộ trên thiết bị này.",
      languageEnglishTitle: "English",
      languageEnglishDescription:
        "Giữ giao diện bằng tiếng Anh cho các buổi demo với recruiter hoặc interviewer.",
      languageVietnameseTitle: "Tiếng Việt",
      languageVietnameseDescription:
        "Hiển thị các phần giao diện chính bằng tiếng Việt.",
      selected: "Đã chọn",
      selectLanguage: "Dùng ngôn ngữ này",
      security: "Bảo mật",
      sessionAccess: "Phiên và quyền truy cập",
      securityHelp:
        "Xem trạng thái phiên đăng nhập hiện tại và các tính năng bảo mật đã được nối trong ứng dụng.",
      sessionStatus: "Trạng thái phiên",
      authenticated: "Đã xác thực",
      sessionStatusHelp:
        "Phiên JWT của bạn hiện đang được lưu trong frontend auth store.",
      passwordManagement: "Quản lý mật khẩu",
      availableNow: "Dùng được ngay",
      passwordManagementHelp:
        "Bạn có thể đổi mật khẩu ngay trong app sau khi xác nhận mật khẩu hiện tại.",
      signOutCard: "Đăng xuất",
      signOutCardHelp:
        "Bạn có thể kết thúc phiên hiện tại an toàn từ menu tài khoản hoặc nút bên dưới.",
      changePassword: "Đổi mật khẩu",
      changePasswordHelp:
        "Hãy dùng mật khẩu mạnh với ít nhất 8 ký tự. Phiên hiện tại vẫn được giữ sau khi cập nhật.",
      currentPassword: "Mật khẩu hiện tại",
      newPassword: "Mật khẩu mới",
      confirmNewPassword: "Xác nhận mật khẩu mới",
      updatePassword: "Cập nhật mật khẩu",
      updatingPassword: "Đang cập nhật...",
      securityGuidance: "Khuyến nghị bảo mật",
      securityTip1:
        "Dùng mật khẩu không trùng với các môi trường hay tài khoản demo khác.",
      securityTip2:
        "Sau khi đổi mật khẩu, các lần đăng nhập tiếp theo sẽ dùng giá trị mới ngay lập tức.",
      securityTip3:
        "Nếu đang dùng tài khoản seed chung, hãy báo cho đồng đội biết thông tin đăng nhập đã thay đổi.",
      passwordUpdateLive: "Đổi mật khẩu đang hoạt động",
      validationEmailRequired: "Email là bắt buộc.",
      validationNameShort: "Tên phải có ít nhất 2 ký tự nếu được nhập.",
      validationCurrentPasswordRequired: "Cần nhập mật khẩu hiện tại.",
      validationNewPasswordShort: "Mật khẩu mới phải có ít nhất 8 ký tự.",
      validationPasswordMismatch: "Xác nhận mật khẩu không khớp.",
      validationPasswordSame:
        "Mật khẩu mới phải khác với mật khẩu hiện tại.",
    },
  },
};

function resolveValue(
  language: AppLanguage,
  key: string
): TranslationValue | TranslationTree | undefined {
  return key.split(".").reduce<TranslationValue | TranslationTree | undefined>(
    (current, segment) => {
      if (!current || typeof current === "string" || typeof current === "function") {
        return undefined;
      }

      return current[segment];
    },
    messages[language]
  );
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: TranslationParams
) {
  const value = resolveValue(language, key);

  if (typeof value === "function") {
    return value(params);
  }

  if (typeof value === "string") {
    return value;
  }

  return key;
}
