package vn.demo.jobhunter.domain.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.demo.jobhunter.domain.Role;

@Getter
@Setter
public class ResLoginDTO {
    @JsonProperty("access_token")
    private String accessToken;

    private UserLogin user;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserLogin {
        private long id;
        private String email;
        private String name;
        private Role role;
        
        private String phone;
        private Integer age;
        private vn.demo.jobhunter.util.constant.GenderEnum gender;
        private String address;
        private java.util.List<String> skills;
        private UserCompany company;

        @JsonProperty("isPremiumCandidate")
        private boolean isPremiumCandidate;
        private java.time.Instant premiumCandidateExpiryDate;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserCompany {
        private long id;
        private String name;
        @JsonProperty("isPremium")
        private boolean isPremium;
        private String premiumTier;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserGetAccount {
        private UserLogin user;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserInsideToken {
        private long id;
        private String email;
        private String name;
    }

}
