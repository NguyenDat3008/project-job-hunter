package vn.demo.jobhunter.service;

import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Review;
import vn.demo.jobhunter.repository.ReviewRepository;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    public Review handleCreateReview(Review review) {
        if (review == null) return null;
        return this.reviewRepository.save(review);
    }
}
