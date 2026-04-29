package vn.demo.jobhunter.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Skill;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.Subscriber;

@Service
public class MatchScoreService {

    private final SubscriberService subscriberService;

    public MatchScoreService(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    // Calculate match score between a user and a job based on skills.
    public Map<String, Object> calculateMatchScore(User user, Job job) {
        Map<String, Object> result = new HashMap<>();

        Subscriber subscriber = user.getEmail() != null ? subscriberService.findByEmail(user.getEmail()) : null;
        List<Skill> subscriberSkills = (subscriber != null && subscriber.getSkills() != null) ? subscriber.getSkills()
                : new ArrayList<>();

        List<String> userSkills = subscriberSkills.stream().map(Skill::getName).map(String::toLowerCase)
                .collect(Collectors.toList());

        List<String> jobSkills = job.getSkills() != null
                ? job.getSkills().stream().map(Skill::getName).map(String::toLowerCase).collect(Collectors.toList())
                : new ArrayList<>();

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String js : jobSkills) {
            if (userSkills.contains(js)) {
                matchedSkills.add(js);
            } else {
                missingSkills.add(js);
            }
        }

        int score = 50; // default score if job has no required skills
        if (!jobSkills.isEmpty()) {
            score = (int) Math.round(((double) matchedSkills.size() / jobSkills.size()) * 100);
        }

        // Add some bonus for location if they match (simplified logic)
        if (user.getAddress() != null && job.getLocation() != null) {
            if (user.getAddress().toLowerCase().contains(job.getLocation().toLowerCase()) ||
                    job.getLocation().toLowerCase().contains(user.getAddress().toLowerCase())) {
                score = Math.min(100, score + 10);
            }
        }

        List<String> reasons = new ArrayList<>();
        if (score >= 80)
            reasons.add("Kỹ năng rất phù hợp");
        else if (score >= 60)
            reasons.add("Kỹ năng khá phù hợp");

        if (job.getIsPremium() != null && job.getIsPremium()) {
            reasons.add("Công ty uy tín");
        }

        result.put("job", job);
        result.put("matchScore", score);
        result.put("matchedSkills", matchedSkills);
        result.put("missingSkills", missingSkills);
        result.put("reasons", reasons);

        return result;
    }
}
