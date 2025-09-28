package files

import (
	"SeekerNotes/internal/config"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type FileData struct {
	Name        string `json:"name"`
	Content     string `json:"content"`
	HTMLContent string `json:"htmlContent"`
}

func LoadSNTsFromDir(conf *config.Config) ([]*FileData, error) {
	_, err := config.EnsureConfigPathExists()
	if err != nil {
		return nil, err
	}
	if !conf.IsUserDirValid() {
		return nil, fmt.Errorf("invalid user directory: %s", conf.UserSelectedDirectory)
	}

	dir, err := os.ReadDir(conf.UserSelectedDirectory)
	if err != nil {
		return nil, err
	}

	files := make([]*FileData, 0, len(dir))
	for _, file := range dir {
		fileData, err := LoadSntFileFromPath(filepath.Join(conf.UserSelectedDirectory, file.Name()))
		if err != nil {
			fmt.Println("ERROR LOADING FILE", file.Name())
			continue
		}
		files = append(files, fileData)
	}
	return files, nil
}

// LoadSntFileFromPath reads a .snt file from disk and returns its content. Returns in raw format
func LoadSntFileFromPath(filePath string) (*FileData, error) {
	if !strings.HasSuffix(filePath, ".snt") {
		return nil, fmt.Errorf("file must have a .snt extension")
	}

	contentBytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	content := string(contentBytes)

	return &FileData{
		Name:        strings.TrimSuffix(filepath.Base(filePath), ".snt"),
		Content:     content,
		HTMLContent: "", // caller will convert SNT to HTML
	}, nil
}

func SaveFileOnDesktop(conf *config.Config, content string, fileName string) error {
	_, err := config.EnsureConfigPathExists()
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(conf.UserSelectedDirectory, fileName+".snt"), []byte(content), 0644)
}
