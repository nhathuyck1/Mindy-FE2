import { Icon } from '@/components/ui/icon';
import { HeroSection } from './hero-section';
import { JourneySection } from './journey-section';
import { StartSection } from './start-section';
import { FeaturedCourses } from './featured-courses';

export function HomeContent() {
  return (
    <div className="home-content text-black">
      <HeroSection />
      <StartSection />
      <section
        id="khoa-hoc"
        className="page-container pb-16 lg:pb-24"
        aria-labelledby="courses-title"
      >
        <h2 id="courses-title" className="section-title mb-8">
          Điểm bắt đầu cho
          <br />ý tưởng tiếp theo.
        </h2>
        <FeaturedCourses />
      </section>
      <JourneySection />
      <section
        id="thuc-hanh"
        className="page-container pb-16 lg:pb-24"
        aria-labelledby="practice-title"
      >
        <div className="grid items-center gap-10 rounded-4xl bg-soft p-7 md:grid-cols-2 lg:gap-14 lg:p-14">
          <div>
            <p className="eyebrow mb-6 text-mint">Không gian thực hành</p>
            <h2 id="practice-title" className="section-title">
              Thử ngay.
              <br />
              Hiểu thêm một chút.
            </h2>
            <p className="mt-6 max-w-90 text-sm leading-relaxed text-muted">
              Đôi khi, cách tốt nhất để hiểu một điều là tự tay làm thử. Mỗi hành trình đều có dòng
              mã nguồn đầu tiên.
            </p>
            <a href="#hanh-trinh" className="text-link mt-5">
              Tìm điểm bắt đầu của bạn <Icon name="arrow" className="size-4" />
            </a>
          </div>
          <div className="min-w-0 overflow-hidden rounded-3xl border border-line bg-canvas shadow-xl shadow-forest/5 lg:rotate-2">
            <div className="flex items-center gap-1.5 border-b border-line px-5 py-4">
              <span className="size-2 rounded-full bg-coral" />
              <span className="size-2 rounded-full bg-line" />
              <span className="size-2 rounded-full bg-mint" />
              <span className="ml-auto font-mono text-[10px] text-muted">hello-mindy.js</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-loose sm:p-7">
              <code>
                <span className="text-muted">{'// Mọi hành trình đều có dòng đầu tiên.'}</span>
                {'\n\n'}
                <span className="font-bold text-mint">const</span>
                {' hello = "Xin chào, Mindy!";\n\nconsole.log(hello);'}
              </code>
            </pre>
            <div className="relative mx-4 mb-4 rounded-2xl bg-soft p-4">
              <p className="text-[10px] text-muted">Kết quả minh họa</p>
              <p className="mt-2 text-sm font-bold">Xin chào, Mindy!</p>
              <Icon name="check" className="absolute right-4 bottom-4 size-4 text-mint" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
