import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, '../server/db/quill.db'));

const slug = 'enterprise-ai-agent-patterns';
const title = 'AI Agent Design Patterns trong Thực Tiễn Doanh Nghiệp';
const subtitle = 'Chuyển từ "Demo-ware" sang Workflows Kinh Doanh Mở Rộng và Bền Vững';

const content = `
<h2>Giới Thiệu</h2>
<p>Việc áp dụng AI tạo sinh trong doanh nghiệp thường bị ngăn cản bởi các vấn đề về hallucination, độ trễ và chi phí. Giải pháp không nằm ở việc cải thiện prompting, mà ở <strong>Agentic Design Patterns</strong>. Chúng ta đang chuyển từ việc yêu cầu các mô hình <em>làm</em> việc gì đó, sang thiết kế các hệ thống <em>hoàn thành</em> workflows.</p>

<img src="/articles/enterprise-ai-patterns/page_01.png" alt="AI Agent Design Patterns Cover" />

<h2>Từ Tương Tác Ad-hoc đến Workflows Được Thiết Kế</h2>
<p>Cách tiếp cận cũ với một mô hình đơn lẻ tạo ra output không thể dự đoán được. Cách tiếp cận mới sử dụng Router và nhiều Agents chuyên biệt để tạo ra output đã được xác minh.</p>

<img src="/articles/enterprise-ai-patterns/page_02.png" alt="The Transformation: Old Way vs New Way" />

<h2>1. Customer Service: The Intelligent Triage Model</h2>
<p><strong>Vấn đề:</strong> Một bot duy nhất không thể xử lý hiệu quả cả việc thực thi kỹ thuật lẫn giảm leo thang cảm xúc.</p>
<p><strong>Pattern: Intent Routing</strong></p>
<ul>
<li><strong>API Agent:</strong> Xử lý các yêu cầu giao dịch (Reset Password, Check Status, Update Address)</li>
<li><strong>Empathy Agent:</strong> Phân tích cảm xúc, giảm leo thang, chuẩn bị chuyển giao cho con người</li>
<li><strong>Triage Agent:</strong> Phân loại ý định và định tuyến đến agent phù hợp</li>
</ul>

<img src="/articles/enterprise-ai-patterns/page_03.png" alt="Customer Service Triage Model" />

<h2>2. Hyper-Personalization: The Personal Tutor Pattern</h2>
<p><strong>Pattern: Memory + RAG + Guardrails</strong></p>
<p>Context thúc đẩy cá nhân hóa, trong khi RAG đảm bảo bot không hallucinate chính sách công ty. Guardrails cung cấp lưới an toàn cuối cùng.</p>

<img src="/articles/enterprise-ai-patterns/page_04.png" alt="Personal Tutor Pattern with Memory and RAG" />

<h2>3. DevOps: Virtual Engineering Squad</h2>
<p><strong>Pattern: Multi-Agent Collaboration & Reflection</strong></p>
<ul>
<li><strong>Dev Agent:</strong> Tạo code</li>
<li><strong>QA Agent:</strong> Kiểm tra cú pháp & logic</li>
<li><strong>Manager Agent:</strong> Điều phối và gửi lại để sửa nếu phát hiện lỗi</li>
</ul>

<img src="/articles/enterprise-ai-patterns/page_05.png" alt="DevOps Multi-Agent Collaboration" />

<h2>4. Autonomous Planning: Database Migration</h2>
<p><strong>Pattern: Reasoning & Planning</strong></p>
<p>Hệ thống tự động phân tích ý định của người dùng và lập kế hoạch thực thi theo các bước:</p>
<ol>
<li>Schema Check - Phân tích cấu trúc DB hiện tại</li>
<li>Provisioning - Tạo RDS Instance</li>
<li>Execution - Chạy migration scripts</li>
<li>Validation - Xác minh tính toàn vẹn dữ liệu</li>
</ol>

<img src="/articles/enterprise-ai-patterns/page_06.png" alt="Autonomous Planning Pattern" />

<h2>5. Content Operations: Industrialized Creativity</h2>
<p><strong>Patterns: Prompt Chaining & Parallelization</strong></p>
<ul>
<li><strong>Pattern A: Chaining</strong> - Quy trình assembly line: Outline → Drafting → Polishing</li>
<li><strong>Pattern B: Parallelization</strong> - Nhiều agents nghiên cứu song song (Market, Tech, Competitor) rồi tổng hợp</li>
</ul>

<img src="/articles/enterprise-ai-patterns/page_07.png" alt="Content Operations Patterns" />

<h2>6. Innovation: Algorithmic Inspiration</h2>
<p><strong>Pattern: Exploration</strong></p>
<p>"Sử dụng Agent không chỉ để viết, mà để tìm ra những góc nhìn bạn đã bỏ lỡ."</p>
<p>Agent tạo ra 20 biến thể ý tưởng khác nhau để vượt qua Writer's Block và khám phá cơ hội thị trường chưa được khai thác.</p>

<img src="/articles/enterprise-ai-patterns/page_08.png" alt="Innovation Exploration Pattern" />

<h2>7. Critical Operations: Human-in-the-Loop</h2>
<p><strong>Pattern: HITL (Human-in-the-Loop)</strong></p>
<p><strong>Context:</strong> Các hành động rủi ro cao (Finance, Security, VIP Communications)</p>
<p><strong>Quy tắc:</strong> Agents chuẩn bị. Con người quyết định.</p>

<img src="/articles/enterprise-ai-patterns/page_09.png" alt="Human-in-the-Loop Pattern" />

<h2>8. Accuracy: Determinism in Probabilistic Systems</h2>
<p><strong>Pattern: Tool Use / Function Calling</strong></p>
<p>Thay vì để LLM đoán kết quả (với rủi ro hallucination), sử dụng deterministic tools như Calculator, Python, hoặc Stock Price API.</p>

<img src="/articles/enterprise-ai-patterns/page_10.png" alt="Tool Use Pattern" />

<h2>9. Economics of Intelligence: Model Routing</h2>
<p><strong>Pattern: Model Routing</strong></p>
<p>Giảm 60-80% chi phí vận hành bằng cách định tuyến:</p>
<ul>
<li><strong>Low Complexity</strong> (Greetings, FAQ) → LLAMA-3-8B (Low Cost / High Speed)</li>
<li><strong>High Complexity</strong> (Strategic Analysis) → GPT-4 (High Cost / High Intelligence)</li>
</ul>

<img src="/articles/enterprise-ai-patterns/page_11.png" alt="Model Routing Pattern" />

<h2>10. Operational Discipline: Guardrails Against Drift</h2>
<p><strong>Pattern: Objective Supervision</strong></p>
<p>Supervisor agent giám sát và điều chỉnh đường đi khi agent chính bị lệch khỏi mục tiêu chính (ví dụ: chuyển hướng từ "đặt khách sạn" về "tìm vé máy bay").</p>

<img src="/articles/enterprise-ai-patterns/page_12.png" alt="Objective Supervision Pattern" />

<h2>Enterprise Agent Framework</h2>
<p>Tổng quan các pattern quan trọng cho kiến trúc AI Agent trong doanh nghiệp:</p>

<img src="/articles/enterprise-ai-patterns/page_13.png" alt="Enterprise Agent Framework Overview" />

<h2>Kết Luận: Từ Prompting đến Engineering</h2>
<p><strong>Thiết kế workflow trước. Intelligence sẽ theo sau.</strong></p>
<p>Để chuyển từ Demo sang Production, hãy ngừng coi AI như một hộp chat kỳ diệu và bắt đầu coi nó như một thành phần trong một workflow có cấu trúc.</p>

<img src="/articles/enterprise-ai-patterns/page_14.png" alt="From Prompting to Engineering" />

<h2>Tài Liệu Tham Khảo</h2>
<p>Nội dung được tổng hợp từ tài liệu "AI Agent Design Patterns in Enterprise Practice" - một playbook dành cho Architects, CTOs và Product Leaders.</p>
`;

const tags = 'AI,Agents,Enterprise,Architecture,Design Patterns,LLM';
const readingTime = 12; // Estimated reading time in minutes

db.run(`
  INSERT INTO articles (slug, title, subtitle, content, coverImage, tags, status, readingTime, publishedAt)
  VALUES (?, ?, ?, ?, ?, ?, 'published', ?, datetime('now'))
`, [slug, title, subtitle, content, '/articles/enterprise-ai-patterns/page_01.png', tags, readingTime], function (err) {
    if (err) {
        console.error('Error inserting article:', err);
    } else {
        console.log(`✅ Article created successfully with ID: ${this.lastID}`);
        console.log(`📝 Title: ${title}`);
        console.log(`🔗 Slug: ${slug}`);
        console.log(`📊 Reading Time: ${readingTime} minutes`);
    }
    db.close();
});
