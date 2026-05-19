package vn.demo.jobhunter.util;

import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import jakarta.servlet.http.HttpServletResponse;
import vn.demo.jobhunter.domain.response.RestResponse;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@ControllerAdvice
public class FormatRestResponse implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(
            @org.springframework.lang.NonNull MethodParameter returnType,
            @org.springframework.lang.NonNull Class<? extends org.springframework.http.converter.HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    @org.springframework.lang.Nullable
    public Object beforeBodyWrite(
            @org.springframework.lang.Nullable Object body,
            @org.springframework.lang.NonNull MethodParameter returnType,
            @org.springframework.lang.NonNull MediaType selectedContentType,
            @org.springframework.lang.NonNull Class<? extends org.springframework.http.converter.HttpMessageConverter<?>> selectedConverterType,
            @org.springframework.lang.NonNull ServerHttpRequest request,
            @org.springframework.lang.NonNull ServerHttpResponse response) {
        HttpServletResponse servletResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = servletResponse.getStatus();

        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(status);

        if (body instanceof String || body instanceof Resource) {
            return body;
        }

        String path = request.getURI().getPath();
        if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui")) {
            return body;
        }

        if (status >= 400) {
            return body;
        } else {
            res.setData(body);
            ApiMessage message = returnType.getMethodAnnotation(ApiMessage.class);
            res.setMessage(message != null ? message.value() : "CALL API SUCCESS");
        }

        return res;
    }

}
