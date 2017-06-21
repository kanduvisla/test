---
title: Import Images
---

There are various articles about how to programmatically import images in Magento 2.
This method relies solely on service contracts and is in my opinion the "Magento Way"
to do it:

```php
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\App\Filesystem\DirectoryList;
use Magento\Framework\Exception\NoSuchEntityException;

/**
 * Class ProductImagesImporter
 */
class ProductImagesImporter 
{
    /**
     * @var DirectoryList
     */
    protected $directoryList;

    /**
     * @var \Magento\Catalog\Api\Data\ProductAttributeMediaGalleryEntryInterfaceFactory
     */
    protected $attributeMediaGalleryEntryFactory;

    /**
     * @var \Magento\Framework\Api\Data\ImageContentInterfaceFactory
     */
    protected $imageContentFactory;

    /**
     * @var ProductRepositoryInterface
     */
    protected $productRepository;

    /**
     * @var \Magento\Framework\File\Mime
     */
    protected $mime;

    /**
     * @var \Magento\Framework\Filesystem\Io\File
     */
    protected $io;

    /**
     * ProductImagesImporter constructor.
     * @param DirectoryList $directoryList
     * @param \Magento\Framework\Filesystem\Io\File $io
     * @param \Magento\Framework\File\Mime $mime
     * @param \Magento\Catalog\Api\Data\ProductAttributeMediaGalleryEntryInterfaceFactory $attributeMediaGalleryEntryFactory
     * @param \Magento\Framework\Api\Data\ImageContentInterfaceFactory $imageContentFactory
     * @param ProductRepositoryInterface $productRepository
     */
    public function __construct(
        DirectoryList $directoryList,
        \Magento\Framework\Filesystem\Io\File $io,
        \Magento\Framework\File\Mime $mime,
        \Magento\Catalog\Api\Data\ProductAttributeMediaGalleryEntryInterfaceFactory $attributeMediaGalleryEntryFactory,
        \Magento\Framework\Api\Data\ImageContentInterfaceFactory $imageContentFactory,
        ProductRepositoryInterface $productRepository
    )
    {
        $this->directoryList = $directoryList;
        $this->mime = $mime;
        $this->io = $io;
        $this->attributeMediaGalleryEntryFactory = $attributeMediaGalleryEntryFactory;
        $this->imageContentFactory = $imageContentFactory;
        $this->productRepository = $productRepository;
    }

    /**
     * @return array
     */
    public static function getRequiredFields()
    {
        return ['sku', 'image'];
    }

    /**
     * @param array $item
     */
    public function importSingle(array $item)
    {
        if ($content = $this->getContentObject($item['image'])) {
            $product = $this->productRepository->get($item['sku']);
            $entries = $product->getMediaGalleryEntries();

            foreach ($entries as $entry) {
                if (basename($entry->getFile()) === basename($content->getName())) {
                    break;
                }
            }

            if (!isset($entry)) {
                $entry = $this->attributeMediaGalleryEntryFactory->create();
            }

            $entry->setContent($content);
            $entry->setMediaType('image');
            $entry->setDisabled(false);

            $entries[] = $entry;
            $product->setMediaGalleryEntries($entries);

            $this->productRepository->save($product);
        }
        
        return true;
    }

    /**
     * @param string $fileName
     * @return \Magento\Framework\Api\Data\ImageContentInterface|null
     */
    protected function getContentObject(string $fileName)
    {
        $srcPath = $this->directoryList->getPath(DirectoryList::VAR_DIR) .
            DIRECTORY_SEPARATOR . 'import' . DIRECTORY_SEPARATOR . $fileName;

        if ($this->io->fileExists($srcPath)) {
            $content = $this->imageContentFactory->create();
            $content->setName(strtolower($fileName));
            $content->setBase64EncodedData(base64_encode(file_get_contents($srcPath)));
            $content->setType($this->mime->getMimeType($srcPath));

            return $content;
        }

        return null;
    }
}
```
Note that we don't copy our image whatsoever, but make use of an `ImageContent` object.
This is a new layer of abstraction in Magento 2 that allows us to save images regardless of the 
storage engine that's behind it.

Usage:

Assuming there's a product with SKU `ABC123` and an image `var/import/foo.jpg`:

```php
$importer->importSingle(['sku' => 'ABC123', 'image' => 'foo.jpg']);
```