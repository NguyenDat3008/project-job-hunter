package vn.demo.jobhunter.service;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Blog;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.repository.BlogRepository;

@Service
public class BlogService {

    private final BlogRepository blogRepository;

    public BlogService(BlogRepository blogRepository) {
        this.blogRepository = blogRepository;
    }

    public Blog create(Blog b) {
        return this.blogRepository.save(b);
    }

    public Blog update(Blog b) {
        Optional<Blog> blogOptional = this.blogRepository.findById(b.getId());
        if (blogOptional.isPresent()) {
            Blog currentBlog = blogOptional.get();
            currentBlog.setTitle(b.getTitle());
            currentBlog.setSummary(b.getSummary());
            currentBlog.setImageUrl(b.getImageUrl());
            currentBlog.setExternalLink(b.getExternalLink());
            return this.blogRepository.save(currentBlog);
        }
        return null;
    }

    public void delete(long id) {
        this.blogRepository.deleteById(id);
    }

    public Optional<Blog> fetchById(long id) {
        return this.blogRepository.findById(id);
    }

    public ResultPaginationDTO fetchAll(Specification<Blog> spec, Pageable pageable) {
        Page<Blog> pageBlog = this.blogRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pageBlog.getTotalPages());
        mt.setTotal(pageBlog.getTotalElements());

        rs.setMeta(mt);
        rs.setResult(pageBlog.getContent());

        return rs;
    }
}
