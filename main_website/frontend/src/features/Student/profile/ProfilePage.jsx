import { useMemo, useState } from 'react';
import { Award, BadgeCheck, Briefcase, FileText, FolderGit2, GraduationCap, Trophy, User, Video } from 'lucide-react';
import { PLATFORM_UNLOCK_PERCENT, getProfileCompletionDetails } from '../../../utils/profileCompleteness';
import ActivityDialog from './dialogs/ActivityDialog';
import CertificateDialog from './dialogs/CertificateDialog';
import EducationDialog from './dialogs/EducationDialog';
import ExperienceDialog from './dialogs/ExperienceDialog';
import IntroVideoDialog from './dialogs/IntroVideoDialog';
import ProjectDialog from './dialogs/ProjectDialog';
import ResumeLinkDialog from './dialogs/ResumeLinkDialog';
import SkillsDialog from './dialogs/SkillsDialog';
import StudentProDialog from './dialogs/StudentProDialog';
import ProfileEdit from './ProfileEdit';
import ProfileOverview from './ProfileOverview';
import { Dialog } from './ui';

// Dialog type → profile list it edits, and the words used in its toast.
const LISTS = {
  education: { key: 'education', noun: 'Education' },
  project: { key: 'projects', noun: 'Project' },
  experience: { key: 'experience', noun: 'Experience' },
  certificate: { key: 'certificates', noun: 'Certificate' },
  activity: { key: 'cocurricular', noun: 'Activity' }
};

// Which profile section an action belongs to (the page scrolls there).
const SECTION_OF = { edit: 'about', video: 'video', education: 'education', project: 'projects', experience: 'experience', certificate: 'certificates', activity: 'activities', skills: 'skills', resume: 'resume' };

const scrollToTop = () => {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Candidate profile (designs in design/candidate_side_design/candidate_profile_design).
 * `generalDone` / `videoDone` / `unlocked` come from the saved profile (utils/profileCompleteness).
 * Shows the profile, the "About you" edit page and the add/edit dialogs. Every
 * save goes through `onSaveProfile(changes)` → { ok, error }, so the layout's
 * state only changes after the server accepts it.
 *
 * First visit: About you opens straight away (step 1); then the candidate fills in the rest
 * until the profile reaches the unlock level (step 2). The intro video is the last section:
 * it is not needed to unlock the portal, only to apply to jobs and gigs.
 * `focus` ({ section: 'video' }) opens the intro video dialog when another page sends the
 * candidate here to add it.
 */
export default function ProfilePage({ data, user, token, focus, generalDone, videoDone, unlocked, techSkills, jobsCount, isPremium, generatingPdf, onDownloadResume, onSaveProfile, onIntroVideoSaved, onPlanUpgraded, onNotify }) {
  const [view, setView] = useState(() => (generalDone ? 'overview' : 'edit'));
  // { id, smooth } — the profile scrolls to this section when it changes.
  const [scrollTarget, setScrollTarget] = useState(() => (focus?.section === 'video' ? { id: 'video' } : null));
  const [firstTime] = useState(() => !generalDone);
  const [dialog, setDialog] = useState(() => (focus?.section === 'video' ? { type: 'video', index: null } : null)); // { type, index }
  const [player, setPlayer] = useState(null); // { url, title }

  const completion = useMemo(() => getProfileCompletionDetails(data), [data]);

  const open = (type, index = null) => setDialog({ type, index });
  const close = () => setDialog(null);

  const onAction = (kind) => {
    if (kind === 'edit') {
      setView('edit');
      scrollToTop();
      return;
    }
    if (SECTION_OF[kind]) setScrollTarget({ id: SECTION_OF[kind] });
    open(kind);
  };

  const count = (list) => (Array.isArray(list) ? list.length : 0);
  // Same order as the sections on the page (ProfileOverview ORDER).
  const sectionItems = [
    { id: 'about', label: 'About you', icon: User, status: generalDone ? 'done' : 'todo' },
    { id: 'skills', label: 'Skills', icon: BadgeCheck, count: count(data.skills) },
    { id: 'projects', label: 'Projects', icon: FolderGit2, count: count(data.projects) },
    { id: 'education', label: 'Education', icon: GraduationCap, count: count(data.education) },
    { id: 'experience', label: 'Experience', icon: Briefcase, count: count(data.experience) },
    { id: 'certificates', label: 'Certificates', icon: Award, count: count(data.certificates) },
    { id: 'activities', label: 'Activities', icon: Trophy, count: count(data.cocurricular) },
    { id: 'resume', label: 'Resume', icon: FileText },
    { id: 'video', label: 'Intro video', icon: Video, status: videoDone ? 'done' : 'todo' }
  ];

  // From the About-you page: another section closes it (after its unsaved-changes
  // check) and the profile opens scrolled to that section.
  const leaveEdit = (id) => {
    setView('overview');
    setScrollTarget({ id, smooth: false });
  };

  const saveList = async (type, nextList, verb) => {
    const { key, noun } = LISTS[type];
    const result = await onSaveProfile({ [key]: nextList });
    if (result.ok) {
      close();
      onNotify(`${noun} ${verb}.`, 'success');
    }
    return result;
  };

  const listDialogProps = (type) => {
    const list = data[LISTS[type].key] || [];
    const index = dialog.index;
    return {
      onClose: close,
      onSave: (record) => saveList(type, index === null ? [...list, record] : list.map((item, i) => (i === index ? record : item)), index === null ? 'added' : 'updated'),
      onRemove: () => saveList(type, list.filter((_, i) => i !== index), 'removed')
    };
  };

  const item = (type) => (dialog?.index === null ? null : (data[LISTS[type].key] || [])[dialog.index] || null);

  const saveAbout = async (changes) => {
    const result = await onSaveProfile(changes);
    if (result.ok) {
      leaveEdit('about');
      onNotify(firstTime && !unlocked ? `Step 1 done. Add more to your profile to reach ${PLATFORM_UNLOCK_PERCENT}% and unlock the rest of the portal.` : 'Your profile is saved.', 'success');
    }
    return result;
  };

  return (
    <>
      {view === 'edit' ? (
        <ProfileEdit
          data={data}
          token={token}
          sections={sectionItems}
          onNavigate={leaveEdit}
          firstTime={firstTime && !generalDone}
          onSave={saveAbout}
          onCancel={() => leaveEdit('about')}
        />
      ) : (
        <ProfileOverview
          data={data}
          sectionItems={sectionItems}
          scrollTarget={scrollTarget}
          completion={completion}
          generalDone={generalDone}
          videoDone={videoDone}
          unlocked={unlocked}
          isPremium={isPremium}
          techSkills={techSkills}
          generatingPdf={generatingPdf}
          onAction={onAction}
          onEditItem={open}
          onPlayVideo={(url, title) => setPlayer({ url, title })}
          onDownloadResume={onDownloadResume}
        />
      )}

      {dialog?.type === 'education' && <EducationDialog education={item('education')} list={data.education || []} {...listDialogProps('education')} />}
      {dialog?.type === 'project' && <ProjectDialog project={item('project')} token={token} profileSkills={data.skills} onPlayVideo={(url) => setPlayer({ url, title: 'Project walkthrough' })} {...listDialogProps('project')} />}
      {dialog?.type === 'experience' && <ExperienceDialog experience={item('experience')} {...listDialogProps('experience')} />}
      {dialog?.type === 'certificate' && <CertificateDialog certificate={item('certificate')} {...listDialogProps('certificate')} />}
      {dialog?.type === 'activity' && <ActivityDialog activity={item('activity')} {...listDialogProps('activity')} />}

      {dialog?.type === 'video' && (
        <IntroVideoDialog
          token={token}
          currentUrl={data.introVideoUrl}
          onClose={close}
          onSaved={(url, message) => {
            close();
            onIntroVideoSaved(url);
            onNotify(message, 'success');
          }}
        />
      )}
      {dialog?.type === 'skills' && (
        <SkillsDialog
          skills={data.skills}
          techSkills={techSkills}
          onClose={close}
          onSave={async (skills) => {
            const result = await onSaveProfile({ skills });
            if (result.ok) {
              close();
              onNotify('Your skills are saved.', 'success');
            }
            return result;
          }}
        />
      )}
      {dialog?.type === 'resume' && (
        <ResumeLinkDialog
          resumeUrl={data.resumeUrl}
          onClose={close}
          onSave={async (resumeUrl) => {
            const result = await onSaveProfile({ resumeUrl });
            if (result.ok) {
              close();
              onNotify(resumeUrl ? 'Your resume link is saved.' : 'Your resume link was removed.', 'success');
            }
            return result;
          }}
        />
      )}
      {dialog?.type === 'pro' && (
        <StudentProDialog
          token={token}
          user={user}
          profile={data}
          jobsCount={jobsCount}
          onClose={close}
          onUpgraded={() => {
            close();
            onPlanUpgraded();
            onNotify('Welcome to Student Pro. Every job and gig is now open to you.', 'success');
          }}
        />
      )}

      {player && (
        <Dialog title={player.title} onClose={() => setPlayer(null)} width="max-w-[860px]">
          <video src={player.url} controls autoPlay playsInline className="aspect-video w-full rounded-[12px] bg-[#0E1B3D] object-contain" />
        </Dialog>
      )}
    </>
  );
}
